export function getDbUrl(): string {
  const {
    DB_NAME,
    DB_PASSWORD,
    DB_USER,
    DB_PORT,
    DB_HOST,
  } = process.env;


  if (!(DB_NAME && DB_PASSWORD && DB_USER && DB_PORT)) {
    throw new Error("Undefined database environment variables");
  }

  const host = DB_HOST ?? 'localhost';
  return `postgres://${DB_USER}:${DB_PASSWORD}@${host}:${DB_PORT}/${DB_NAME}`;
}
