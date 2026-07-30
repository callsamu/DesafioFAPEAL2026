import { metricsTable } from './db/schema';
import { Row } from './validation/rows';

export type MetricsRecord = typeof metricsTable.$inferInsert;

export function rowToRecord(row: Row): MetricsRecord {
  return {
    municipalityCode: row.co_mun,
    municipalityName: row.no_mun,
    year: row.ano,
    source: row.fonte,
    variable: row.variavel,
    schoolNetwork: row.ensino_rede,
    educationLevel: row.ensino_tipo,
    value: row.valor,
  };
}
