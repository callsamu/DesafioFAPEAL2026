import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { MetricsRecord } from '../record';
import { EducationLevelEnum, SchoolNetworkEnum, VariableEnum, SourceEnum } from '../validation/rows';
import { batchTable, metricsTable } from '../db/schema';
import z from 'zod';
import { assert } from 'node:console';

export interface BatchResult {
  batchId: number;
}


type Sources = z.infer<typeof SourceEnum>;

export interface Page<T> {
  size: number;
  offset: number;
  data: T[];
}

export type EmptyPage = Omit<Page<any>, 'data'>;

export interface Filters {
  municipality: string;
  startYear: number;
  endYear: number;
  network: z.infer<typeof SchoolNetworkEnum>;
  level: z.infer<typeof EducationLevelEnum>;
  variable: z.infer<typeof VariableEnum>;
}

export interface FilterListing {
  municipalities: string[];
  years: number[];
  networks: typeof SchoolNetworkEnum.options;
  levels: typeof EducationLevelEnum.options;
  variables: typeof VariableEnum.options;
}

export interface MetricsRepository {
  createBatch(): Promise<BatchResult>;
  insertMetrics(records: MetricsRecord[], batchId: number): Promise<void>;
  completeBatch(batchId: number): Promise<void>;
  deleteByBatchId(batchId: number): Promise<void>;
  listFilters(): Promise<FilterListing>;
}

export class DrizzleMetricsRepository implements MetricsRepository {
  constructor(private db: NodePgDatabase) {}

  async createBatch(): Promise<BatchResult> {
    const ids = await this.db
      .insert(batchTable)
      .values({ status: 'pending' })
      .returning({ id: batchTable.id });
    return { batchId: ids[0].id };
  }

  async insertMetrics(records: MetricsRecord[], batchId: number): Promise<void> {
    const rows = records.map(r => ({ ...r, batchId }));
    await this.db.insert(metricsTable).values(rows);
  }

  async completeBatch(batchId: number): Promise<void> {
    await this.db
      .update(batchTable)
      .set({ status: 'completed' })
      .where(eq(batchTable.id, batchId));
  }

  async deleteByBatchId(batchId: number): Promise<void> {
    await this.db.delete(metricsTable).where(eq(metricsTable.batchId, batchId));
  }

  async listFilters(): Promise<FilterListing> {
    const result = await this.db.execute(sql`
      SELECT json_build_object(
        'municipalities', json_agg(DISTINCT municipality_name),
        'years', json_agg(DISTINCT year)
      ) as filters 
      FROM ${metricsTable}
    `) 

    assert(result.rowCount == 1);
    
    const [{ filters }] = result.rows as unknown as {
      filters: Pick<FilterListing, 'municipalities' | 'years'>
    }[];

    return {
      ...filters,
      networks: SchoolNetworkEnum.options,
      levels: EducationLevelEnum.options,
      variables: VariableEnum.options,
    }
  }

  async data(f: Partial<Filters>, page: EmptyPage): Promise<Page<MetricsRecord>> {
    const conditions = [];

    if (f.level) {
      conditions.push(eq(metricsTable.educationLevel, f.level));
    }

    if (f.municipality) {
      conditions.push(eq(metricsTable.municipalityName, f.municipality));
    }

    if (f.startYear) {
      conditions.push(gte(metricsTable.year, f.startYear));
    }

    if (f.endYear) {
      conditions.push(lte(metricsTable.year, f.endYear));
    }

    conditions.push(eq(metricsTable.schoolNetwork, f.network ?? "Total"));

    const result = await this.db
      .select()
      .from(metricsTable)
      .where(and(...conditions))
      .orderBy(metricsTable.id)
      .limit(page.size)
      .offset(page.size * (page.offset - 1));

    return {
      ...page,
      data: result as MetricsRecord[],
    };
  }
}
