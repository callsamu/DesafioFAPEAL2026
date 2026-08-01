import { Request, Response } from 'express';
import busboy from 'busboy';
import { CSVParser } from './parser';
import { MetricsRepository } from './repositories/metrics';
import { DataQuerySchema, FiltersSchema } from './validation/queries';
import { formatZodError } from './validation/errors';

type Handler = (req: Request, res: Response) => void;

function success(res: Response, data: unknown) {
    res.status(200).json({ status: 'success', data });
}

function error(res: Response, message: unknown, statusCode = 400) {
    res.status(statusCode).json({ status: 'error', error: message });
}

export const healthcheck: Handler = (req, res) => {
    success(res, { status: 'ok' });
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

                    success(res, {
                        read: result.read,
                        imported: result.imported,
                        rejected: result.rejected,
                        errors: Object.fromEntries(result.errors),
                    });
                })
                .catch(async (err: Error) => {
                    if (!res.headersSent) {
                        error(res, err.message);
                    }
                    if (batchId) await repo.deleteByBatchId(batchId);
                });
        });

        bb.on('error', async (err: Error) => {
            if (!res.headersSent) {
                error(res, err.message);
                if (batchId) await repo.deleteByBatchId(batchId);
            }
        });

        bb.on('close', () => {
            if (!gotFile && !res.headersSent) {
                error(res, 'Nenhum arquivo enviado');
            }
        });

        req.pipe(bb);
    };
}

export function listFilters(repo: MetricsRepository): Handler {
    return async (req, res) => {
        const filters = await repo.listFilters();
        success(res, filters);
    };
}

export function listData(repo: MetricsRepository): Handler {
    return async (req, res) => {
        const parsed = DataQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            error(res, formatZodError(parsed.error));
            return;
        }

        const { size, page: offset, ...filters } = parsed.data;
        const page = await repo.listData(filters, { size, offset });
        success(res, page);
    };
}

export function indicators(repo: MetricsRepository): Handler {
    return async (req, res) => {
        const parsed = FiltersSchema.safeParse(req.query);
        if (!parsed.success) {
            error(res, formatZodError(parsed.error));
            return;
        }

        const result = await repo.indicators(parsed.data);
        success(res, result);
    };
}

export function series(repo: MetricsRepository): Handler {
    return async (req, res) => {
        const parsed = FiltersSchema.safeParse(req.query);
        if (!parsed.success) {
            error(res, formatZodError(parsed.error));
            return;
        }

        const result = await repo.series(parsed.data);
        success(res, result);
    };
}

export function breakdown(repo: MetricsRepository): Handler {
    return async (req, res) => {
        const parsed = FiltersSchema.safeParse(req.query);
        if (!parsed.success) {
            error(res, formatZodError(parsed.error));
            return;
        }

        const result = await repo.breakdown(parsed.data);
        success(res, result);
    };
}