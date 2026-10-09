import {existsSync} from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';
import pg from 'pg';
import {startServer} from '@brasa-brava/backend/server';
import {createDb, createPool} from '@brasa-brava/backend/db';
import {seedDemoData} from '@brasa-brava/backend/seed';

const DB_NAME = 'brasa_brava';
const DB_USER = 'brasa';

// Pide al sistema un puerto TCP libre en localhost
export const findFreePort = () =>
  new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const {port} = server.address();
      server.close(() => resolve(port));
    });
  });

// Arranca el Postgres embebido en la carpeta de datos (lo inicializa la primera vez)
export const startDatabase = async ({dataDir, password}) => {
  const databaseDir = path.join(dataDir, 'pgdata');
  const port = await findFreePort();
  const postgres = new EmbeddedPostgres({
    databaseDir,
    user: DB_USER,
    password,
    port,
    persistent: true,
    onLog: () => {},
  });
  if (!existsSync(path.join(databaseDir, 'PG_VERSION'))) {
    await postgres.initialise();
  }
  await postgres.start();
  const admin = new pg.Client({
    host: '127.0.0.1',
    port,
    user: DB_USER,
    password,
    database: 'postgres',
  });
  await admin.connect();
  const {rowCount} = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [DB_NAME]);
  if (rowCount === 0) {
    await admin.query(`CREATE DATABASE ${DB_NAME}`);
  }
  await admin.end();
  const url = `postgres://${DB_USER}:${encodeURIComponent(password)}@127.0.0.1:${port}/${DB_NAME}`;
  return {url, stop: () => postgres.stop()};
};

// Levanta base + API sirviendo el frontend compilado y devuelve la URL de la app
export const startDesktopServices = async ({dataDir, staticDir, settings}) => {
  const database = await startDatabase({dataDir, password: settings.dbPassword});
  const port = await findFreePort();
  const api = await startServer({
    NODE_ENV: 'production',
    PORT: String(port),
    DATABASE_URL: database.url,
    JWT_SECRET: settings.jwtSecret,
    STATIC_DIR: staticDir,
    CORS_ORIGINS: `http://127.0.0.1:${port}`,
    MAIL_DRIVER: settings.mailDriver,
    BREVO_API_KEY: settings.brevoApiKey || undefined,
  });
  if (settings.seedDemoData) {
    const db = createDb(createPool(database.url));
    await seedDemoData(db);
    await db.close();
  }
  return {
    url: `http://127.0.0.1:${port}`,
    // Detiene la API y luego la base de datos
    stop: async () => {
      await api.stop();
      await database.stop();
    },
  };
};
