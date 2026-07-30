import { snakeCase, index } from "drizzle-orm/pg-core";

export const metricsTable = snakeCase.table('metrics', (t) => ({
    id: t.serial().primaryKey(),
    municipalityCode: t.varchar({ length: 7 }).notNull(),
    municipalityName: t.text().notNull(),
    year: t.smallint().notNull(),
    source: t.text().notNull(),
    variable: t.text().notNull(),
    schoolNetwork: t.text().notNull(),
    educationLevel: t.text().notNull(),
    value: t.numeric().notNull(), 
}), (t) => [
    index('aggregates_idx')
        .on(t.year, t.variable, t.schoolNetwork, t.educationLevel)
]);