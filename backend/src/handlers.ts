import { Request, Response } from 'express';
import busboy from 'busboy';
import { CSVParser } from './parser';
import { MetricsRepository } from './repositories/metrics';
import { DataQuerySchema, FiltersSchema } from './validation/queries';

type Handler = (req: Request, res: Response) => void;

export const healthcheck: Handler = (req, res) => {
    res.status(200).json({ status: 'ok' })
};

export function upload(repo: MetricsRepository): Handler {
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

            const inserts: Promise<void>[] = [];

            const parser = new CSVParser({
                batchSize: 5000,
                onBatch: async (batch) => {
                    if (!batchId) {
                        const result = await repo.createBatch();
                        batchId = result.batchId;
                    }
                    inserts.push(repo.insertMetrics(batch, batchId));
                },
            });

            parser.parse(fileStream)
                .then(async (result) => {
                    await Promise.all(inserts);
                    await repo.completeBatch(batchId);

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
                    if (batchId) await repo.deleteByBatchId(batchId);
                });
        });

        bb.on('error', async (err: Error) => {
            if (!res.headersSent) {
                res.status(400).json({ error: err.message });
                if (batchId) await repo.deleteByBatchId(batchId);
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

export function listFilters(repo: MetricsRepository): Handler {
    return async (req, res) => {
        const filters = await repo.listFilters();
        res.status(200).json(filters);
    };
}

export function listData(repo: MetricsRepository): Handler {
    return async (req, res) => {
        const parsed = DataQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.issues });
            return;
        }

        const { size, page: offset, ...filters } = parsed.data;
        const page = await repo.listData(filters, { size, offset });
        res.status(200).json(page);
    };
}

export function indicators(repo: MetricsRepository): Handler {
    return async (req, res) => {
        const parsed = FiltersSchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.issues });
            return;
        }

        const result = await repo.indicators(parsed.data);
        res.status(200).json(result);
    };
}