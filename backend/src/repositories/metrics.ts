import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, avg, desc, eq, gte, lte, max, min, sql, sum, type Query } from 'drizzle-orm';
import { MetricsRecord } from '../record';
import { batchTable, metricsTable } from '../db/schema';
import { assert } from 'node:console';
import { Filters, VariableFilters } from '../validation/queries';
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

export type Breakdown = 
  Pick<typeof metricsTable.$inferInsert, 'schoolNetwork' | 'value'>


export interface Indicators {
  matriculas: number | null;
  ofertasEscolas: number | null;
  taxaMediaDeAprovacao: number | null;
}


export interface MunicipalityData {
  municipalityName: string;
  value: number | null;
}

export interface SeriesData {
  year: number;
  value: number | null;
}

export interface MetricsRepository {
  transaction<T>(callback: (repo: MetricsRepository) => Promise<T>): Promise<T>;
  createBatch(): Promise<BatchResult>;
  insertMetrics(records: MetricsRecord[], batchId: number): Promise<void>;
  completeBatch(batchId: number): Promise<void>;
  deleteByBatchId(batchId: number): Promise<void>;
  dropAll(): Promise<void>;
  listFilters(): Promise<FilterListing>;
  listData(filters: Filters, page: EmptyPage): Promise<Page<Omit<MetricsRecord, 'batchId'>>>;
  indicators(filters: Filters): Promise<Indicators>;
  ranking(filters: Filters, limit: number): Promise<MunicipalityData[]>;
  series(filters: Filters): Promise<SeriesData[]>;
  breakdown(filters: Filters): Promise<Breakdown[]>;
}

export class DrizzleMetricsRepository implements MetricsRepository {
  constructor(private db: NodePgDatabase) {}

  private filterConditions(table: AnyPgTable, f: Filters, defaultNetwork: string | null = 'Total') {
    const t = table as typeof metricsTable;
    const conditions = [];

    if (f.level) {
      conditions.push(eq(t.educationLevel, f.level));
    }

    if (f.municipality) {
      conditions.push(eq(t.municipalityName, f.municipality));
    }

    if (f.year) {
      conditions.push(eq(t.year, f.year));
    } else {
      if (f.startYear) {
        conditions.push(gte(t.year, f.startYear));
      }

      if (f.endYear) {
        conditions.push(lte(t.year, f.endYear));
      }
    }

    if (f.variable) {
      conditions.push(eq(t.variable, f.variable))
    }

    if (defaultNetwork !== null) {
      conditions.push(eq(t.schoolNetwork, f.network ?? defaultNetwork));
    }

    return conditions;
  }

  async transaction<T>(callback: (repo: MetricsRepository) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => {
      return callback(new DrizzleMetricsRepository(tx));
    });
  }

  private variableAggregate(variable: string) {
    const v = metricsTable.value;

    return variable.startsWith('Taxa') ?
      sql<number>`AVG(${v})` :
      sql<number>`SUM(${v})`;
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

  async dropAll(): Promise<void> {
    await this.db.execute(sql`TRUNCATE TABLE metrics, batches RESTART IDENTITY`);
  }

  async listFilters(): Promise<FilterListing> {
    const result = await this.db.execute(sql`
      SELECT json_build_object(
        'municipalities', json_agg(DISTINCT municipality_name),
        'years', json_agg(DISTINCT year),
        'networks', json_agg(DISTINCT school_network) FILTER (WHERE school_network <> 'Não se aplica'),
        'levels', json_agg(DISTINCT education_level) FILTER (WHERE education_level <> 'Pessoas de 15 anos ou mais de idade'),
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

  async listData(f: VariableFilters, page: EmptyPage): Promise<Page<Omit<MetricsRecord, 'batchId'>>> {
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
            level: f.level,
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
          year: f.year,
          level: f.level,
        })),
      );
    
    const results = await Promise.all([enrollments, offers, average]);
    const indicators = results
      .map(r => r[0])
      .reduce((a, b) => ({ ...a, ...b }), {}) as Indicators;

    return indicators;
  }

  async ranking({ municipality: _, ...f }: VariableFilters, limit: number): Promise<MunicipalityData[]> {
    const average = avg(metricsTable.value)
      .mapWith(Number)
      .as('avg_value');

    const result = await this.db
      .select({
        municipalityName: metricsTable.municipalityName,
        value: average,
      })
      .from(metricsTable)
      .where(
        and(
          ...this.filterConditions(metricsTable, f)
        )
      )
      .limit(limit)
      .orderBy(desc(average))
      .groupBy(metricsTable.municipalityName);

    return result;
  }

  async series({ year, startYear, endYear, municipality, ...f }: VariableFilters): Promise<SeriesData[]> {
    const { rows } = await this.db.execute(sql<SeriesData>`
      WITH 
      year_range AS (
        SELECT MIN(year) as a, MAX(year) as b
        FROM metrics
      ),
      years AS (
        SELECT generate_series(a, b, 1) AS year
        FROM year_range 
      )
      SELECT
        y.year, 
        ${f.variable.startsWith('Taxa') ? sql`AVG(value)` : sql`SUM(value)`}
        AS value
      FROM years y
      LEFT JOIN ${metricsTable} m
      ON m.year = y.year
      AND m.variable = ${f.variable}
      AND m.school_network = ${f.network ?? 'Total'}
      AND m.education_level = ${f.level ?? 'Ensino Fundamental'}
      ${municipality ? sql`AND m.municipality_name = ${municipality}` : sql``}
      GROUP BY y.year
      ORDER BY y.year ASC
    `);

    return rows as unknown as SeriesData[];
  }

  async breakdown({ network: _, ...f }: VariableFilters): Promise<Breakdown[]> {
    const result = await this.db
      .select({
        schoolNetwork: metricsTable.schoolNetwork,
        value: f.variable.startsWith('Taxa') ? 
          sql<number>`AVG(${metricsTable.value})` :
          sql<number>`SUM(${metricsTable.value})`
      })
      .from(metricsTable)
      .where(and(...this.filterConditions(metricsTable, f, null)))
      .groupBy(metricsTable.schoolNetwork);

    return result;
  }
}
