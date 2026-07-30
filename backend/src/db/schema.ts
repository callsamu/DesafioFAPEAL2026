import { snakeCase, index, varchar } from "drizzle-orm/pg-core";

export const batchTable = snakeCase.table('batches', (t) => ({
    id: t.serial().primaryKey(),
    status: varchar({ enum: ['pending', 'completed']}).notNull()
}));

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
    batchId: t.integer().references(() => batchTable.id)
}), (t) => [
    index('aggregates_idx')
        .on(t.year, t.variable, t.schoolNetwork, t.educationLevel)
]);