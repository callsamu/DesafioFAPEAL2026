import { defineConfig } from 'drizzle-kit';
import { getDbUrl } from './src/db/connection';
import { configDotenv } from 'dotenv';


configDotenv();

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: getDbUrl(),
  },
});
