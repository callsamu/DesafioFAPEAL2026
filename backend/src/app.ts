import express from 'express';
import cors from 'cors';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleMetricsRepository } from './repositories/metrics';
import { registerRoutes } from './routes';
import { registerDocs } from './docs';

interface AppOpts {
    db: NodePgDatabase;
    origin: string;
}
export function createApp(opts: AppOpts) {
    const app = express();
    const repo = new DrizzleMetricsRepository(opts.db);

    app.use(cors());

    registerRoutes(app, repo);
    registerDocs(app);

    return app;
}