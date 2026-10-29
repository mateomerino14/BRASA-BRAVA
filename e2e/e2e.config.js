import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const serverUrl = process.env.E2E_DATABASE_SERVER ?? 'postgres://postgres:postgres@localhost:5432';

export const databaseName = 'brasa_e2e';
export const adminDatabaseUrl = `${serverUrl}/postgres`;
export const port = 3100;
export const baseURL = `http://127.0.0.1:${port}`;

// Variables con las que arranca la API durante las pruebas
export const E2E_ENV = {
  NODE_ENV: 'test',
  PORT: String(port),
  DATABASE_URL: `${serverUrl}/${databaseName}`,
  JWT_SECRET: 'e2e-secreto-de-pruebas-suficientemente-largo',
  MAIL_DRIVER: 'console',
  RATE_LIMIT_ENABLED: 'false',
  CORS_ORIGINS: baseURL,
  STATIC_DIR: path.join(root, '..', 'frontend', 'dist'),
};
