import { createApp } from './app';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { getDbUrl } from './db/connection';
import { configDotenv } from 'dotenv';

configDotenv();

const url = getDbUrl();
const db = drizzle(url);

const port = Number(process.env.PORT ?? 3000);

migrate(db, { migrationsFolder: './migrations' }).then(() => {
  const app = createApp({ db });
  app.listen(port);
});