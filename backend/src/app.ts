import express from 'express';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as handlers from './handlers';

interface AppOpts {
    db: NodePgDatabase;
}
export function createApp(opts: AppOpts) {
    const app = express();

    app.get('/api/healthcheck', handlers.healthcheck);
    app.post('/api/upload', handlers.upload(opts.db));

    return app;
}