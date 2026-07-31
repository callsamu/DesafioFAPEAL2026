import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, eq, gte, lte, sql, sum, type Query } from 'drizzle-orm';
import { MetricsRecord } from '../record';
import { batchTable, metricsTable } from '../db/schema';
import { assert } from 'node:console';
import { Filters } from '../validation/queries';
import { alias, AnyPgTable } from 'drizzle-orm/pg-core';

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
  networks: string[];
  levels: string[];
  variables: string[];
}

export interface Indicators {
  matriculas: number | null;
  ofertasEscolas: number | null;
  taxaMediaDeAprovacao: number | null;
}

export interface MetricsRepository {
  createBatch(): Promise<BatchResult>;
  insertMetrics(records: MetricsRecord[], batchId: number): Promise<void>;
  completeBatch(batchId: number): Promise<void>;
  deleteByBatchId(batchId: number): Promise<void>;
  listFilters(): Promise<FilterListing>;
  listData(filters: Filters, page: EmptyPage): Promise<Page<Omit<MetricsRecord, 'batchId'>>>;
  indicators(filters: Filters): Promise<Indicators>;
}

export class DrizzleMetricsRepository implements MetricsRepository {
  constructor(private db: NodePgDatabase) {}

  private filterConditions(table: AnyPgTable, f: Filters) {
    const t = table as typeof metricsTable;
    const conditions = [];

    if (f.level) {
      conditions.push(eq(t.educationLevel, f.level));
    }

    if (f.municipality) {
      conditions.push(eq(t.municipalityName, f.municipality));
    }

    if (f.startYear) {
      conditions.push(gte(t.year, f.startYear));
    }

    if (f.endYear) {
      conditions.push(lte(t.year, f.endYear));
    }

    if (f.variable) {
      conditions.push(eq(t.variable, f.variable))
    }

    conditions.push(eq(t.schoolNetwork, f.network ?? "Total"));

    return conditions;
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
        'years', json_agg(DISTINCT year),
        'networks', json_agg(DISTINCT school_network),
        'levels', json_agg(DISTINCT education_level),
        'variables', json_agg(DISTINCT variable)
      ) as filters 
      FROM ${metricsTable}
    `) 

    assert(result.rowCount == 1);
    
    const [{ filters }] = result.rows as unknown as {
      filters: FilterListing
    }[];

    return filters;
  }

  async listData(f: Filters, page: EmptyPage): Promise<Page<Omit<MetricsRecord, 'batchId'>>> {
    const result = await this.db
      .select()
      .from(metricsTable)
      .where(and(...this.filterConditions(metricsTable, f)))
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

  async indicators({ variable, ...f }: Filters)  {
    const enrollments = this.db
      .select({ enrollments: sum(metricsTable.value)  })
      .from(metricsTable)
      .where(
        and(
          ...this.filterConditions(metricsTable, { ...f, variable: 'Matrícula' }),
        )
      );

    const offers = this.db
      .select({ offers: sum(metricsTable.value )})
      .from(metricsTable)
      .where(
        and(
          ...this.filterConditions(metricsTable, {
            ...f,
            variable: 'Escolas',
            level: f.level ?? 'Ensino Fundamental',
          }),
        )
      );
    
    
    const m = alias(metricsTable, 'm');
    const mt = alias(metricsTable, 'mt');

    const average = this.db
      .select({
        averageApproval: sql<number>`
          SUM(${m.value} * ${mt.value}) / NULLIF(SUM(${mt.value}), 0)
        `,
      })
      .from(m)
      .innerJoin(
        mt,
        and(
          eq(m.municipalityCode, mt.municipalityCode),
          eq(m.year, mt.year),
          eq(m.schoolNetwork, mt.schoolNetwork),
          eq(m.educationLevel, mt.educationLevel),
          eq(mt.variable, "Matrícula"),
        ),
      )
      .where(
        and(...this.filterConditions(m, {
          variable: "Taxa de Aprovação",
          network: "Total",
          startYear: f.startYear,
          endYear: f.endYear,
          level: f.level,
        })),
      );
    
    const results = await Promise.all([enrollments, offers, average]);
    const indicators = results
      .map(r => r[0])
      .reduce((a, b) => ({ ...a, ...b }), {}) as Indicators;

    return indicators;
  }
}
