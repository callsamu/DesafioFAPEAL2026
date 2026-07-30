import { createApp } from './app';
import { drizzle } from 'drizzle-orm/node-postgres';

const app = createApp({});
app.listen(3000);