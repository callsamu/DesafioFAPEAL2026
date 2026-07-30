import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Request, Response } from 'express';
import busboy from 'busboy';
import { CSVParser } from './parser';
import { batchTable, metricsTable } from './db/schema';
import { assert } from 'node:console';
import { eq } from 'drizzle-orm';

type Handler = (req: Request, res: Response) => void;

export const healthcheck: Handler = (req, res) => {
    res.status(200).json({ status: 'ok' })
};

export function upload(db: NodePgDatabase): Handler {
    return async (req, res) => {
        const bb = busboy({ headers: req.headers });
        let batchId: number;
        let gotFile = false;

        bb.on('file', async (_, fileStream) => {
            if (gotFile) {
                fileStream.resume();
                return;
            }
            gotFile = true;

            const inserts: Promise<unknown>[] = [];

            const parser = new CSVParser({
                batchSize: 5000,
                onBatch: async (batch) => {
                    if (!batchId) {
                        const ids = await db
                            .insert(batchTable)
                            .values({ status: 'pending'})
                            .returning({ id: batchTable.id });
                        assert(ids.length == 1);
                        batchId = ids[0].id;
                    }

                    const batchWithId = batch.map(b => ({ ...b, batchId }))
                    const insert = db.insert(metricsTable).values(batchWithId);
                    inserts.push(insert);
                },
            });

            parser.parse(fileStream)
                .then(async (result) => {
                    await Promise.all(inserts);
                    await db
                        .update(batchTable)
                        .set({ status: 'completed' })
                        .where(eq(batchTable.id, batchId));

                    res.status(200).json({
                        read: result.read,
                        imported: result.imported,
                        rejected: result.rejected,
                        errors: Object.fromEntries(result.errors),
                    });
                })
                .catch(async (err: Error) => {
                    if (!res.headersSent) {
                        res.status(400).json({ error: err.message });
                    }
                    if (batchId) await db.delete(metricsTable).where(eq(metricsTable.batchId, batchId));
                });
        });

        bb.on('error', async (err: Error) => {
            if (!res.headersSent) {
                res.status(400).json({ error: err.message });
                if (batchId) await db.delete(metricsTable).where(eq(metricsTable.batchId, batchId));
            }
        });

        bb.on('close', () => {
            if (!gotFile && !res.headersSent) {
                res.status(400).json({ error: 'Nenhum arquivo enviado' });
            }
        });

        req.pipe(bb);
    };
}