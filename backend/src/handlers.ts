import { Request, Response } from 'express';
import busboy from 'busboy';
import { CSVParser } from './parser';
import { MetricsRepository } from './repositories/metrics';
import { DataQuerySchema, FiltersSchema, RankingQuerySchema } from './validation/queries';
import { formatZodError } from './validation/errors';
import { parseArgs } from 'node:util';

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
        let gotFile = false;

        bb.on('file', async (_, fileStream) => {
            if (gotFile) {
                fileStream.resume();
                return;
            }
            gotFile = true;

            try {
                const result = await repo.transaction(async (tx) => {
                    let batchId: number | undefined;
                    let chain: Promise<void> = Promise.resolve();

                    const parser = new CSVParser({
                        batchSize: 5000,
                        onBatch: (batch) => {
                            chain = chain.then(async () => {
                                if (!batchId) {
                                    batchId = (await tx.createBatch()).batchId;
                                }
                                await tx.insertMetrics(batch, batchId);
                            });
                        },
                    });

                    const parseResult = await parser.parse(fileStream);
                    await chain;
                    if (batchId) {
                        await tx.completeBatch(batchId);
                    }

                    return parseResult;
                });

                success(res, {
                    read: result.read,
                    imported: result.imported,
                    rejectedRows: result.rejectedRows,
                });
            } catch (err) {
                if (!res.headersSent) {
                    error(res, (err as Error).message);
                }
            }
        });

        bb.on('error', async (err: Error) => {
            if (!res.headersSent) {
                error(res, err.message);
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

export function drop(repo: MetricsRepository): Handler {
    return async (req, res) => {
        await repo.dropAll();
        success(res, { deleted: true });
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

export function ranking(repo: MetricsRepository): Handler {
    return async (req, res) => {
        const parsed = RankingQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            error(res, formatZodError(parsed.error));
            return;
        }

        const { limit, ...filters } = parsed.data;
        const result = await repo.ranking(filters, limit);
        success(res, result);
    }
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