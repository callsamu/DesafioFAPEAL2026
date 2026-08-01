import express from 'express';
import cors from 'cors';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as handlers from './handlers';
import { DrizzleMetricsRepository } from './repositories/metrics';

interface AppOpts {
    db: NodePgDatabase;
}
export function createApp(opts: AppOpts) {
    const app = express();
    const repo = new DrizzleMetricsRepository(opts.db);

    app.use(cors());

    app.get('/api/healthcheck', handlers.healthcheck);
    app.post('/api/upload', handlers.upload(repo));

    app.get('/api/filters', handlers.listFilters(repo));
    app.get('/api/data', handlers.listData(repo));
    app.get('/api/indicators', handlers.indicators(repo));
    app.get('/api/series', handlers.series(repo));
    app.get('/api/breakdown', handlers.breakdown(repo));

    return app;
}