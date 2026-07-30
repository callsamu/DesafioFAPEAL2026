export function getDbUrl(): string {
  const {
    DB_NAME,
    DB_PASSWORD,
    DB_USER,
    DB_PORT,
  } = process.env;


  if (!(DB_NAME && DB_PASSWORD && DB_USER && DB_PORT)) {
    throw new Error("Undefined database environment variables");
  }

  return `postgres://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}`;
}
