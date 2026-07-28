import express from 'express';
import * as handlers from './handlers';

interface AppOpts {
    port: number
}
export function createApp(opts: AppOpts) {
    const app = express();
    app.use(express.json());
    
    app.get('/api/healthcheck', handlers.healthcheck);
    
    return app;
}