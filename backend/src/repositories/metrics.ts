import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { DataRecord } from '../validation/schema';
import { batchTable, metricsTable } from '../db/schema';

export interface BatchResult {
  batchId: number;
}

export interface MetricsRepository {
  createBatch(): Promise<BatchResult>;
  insertMetrics(records: DataRecord[], batchId: number): Promise<void>;
  completeBatch(batchId: number): Promise<void>;
  deleteByBatchId(batchId: number): Promise<void>;
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

  async insertMetrics(records: DataRecord[], batchId: number): Promise<void> {
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
}
