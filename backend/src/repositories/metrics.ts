import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { MetricsRecord } from '../record';
import { EducationLevelEnum, SchoolNetworkEnum, VariableEnum } from '../validation/enums';
import { batchTable, metricsTable } from '../db/schema';
import z from 'zod';
import { assert } from 'node:console';
import { Filters } from '../validation/queries';

export interface BatchResult {
  batchId: number;
}

export interface Page<T> {
  size: number;
  offset: number;
  data: T[];
}

export type EmptyPage = Omit<Page<any>, 'data'>;

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
  listData(filters: Filters, page: EmptyPage): Promise<Page<Omit<MetricsRecord, 'batchId'>>>;
}

export class DrizzleMetricsRepository implements MetricsRepository {
  constructor(private db: NodePgDatabase) {}

  private filtersClause(f: Filters) {
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

    if (f.variable) {
      conditions.push(eq(metricsTable.variable, f.variable))
    }

    conditions.push(eq(metricsTable.schoolNetwork, f.network ?? "Total"));

    return and(...conditions);
  }

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

  async listData(f: Filters, page: EmptyPage): Promise<Page<Omit<MetricsRecord, 'batchId'>>> {
    const result = await this.db
      .select()
      .from(metricsTable)
      .where(this.filtersClause(f))
      .orderBy(metricsTable.id)
      .limit(page.size)
      .offset(page.size * (page.offset - 1));

    const data = (result as MetricsRecord[])
      .map(({ batchId: _batchId, ...rest }) => rest);

    return {
      ...page,
      data,
    };
  }
}
