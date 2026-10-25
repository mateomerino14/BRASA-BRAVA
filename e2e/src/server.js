import {existsSync} from 'node:fs';
import {mkdir, rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import EmbeddedPostgres from 'embedded-postgres';
import pg from 'pg';
import {startServer} from '@brasa-brava/backend/server';
import {createDb, createPool} from '@brasa-brava/backend/db';
import {seedDemoData} from '@brasa-brava/backend/seed';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const staticDir = path.join(rootDir, 'frontend', 'dist');
const dataDir = path.join(rootDir, 'e2e', '.tmp');
const embeddedPort = 54329;
const embeddedUser = 'brasa';
const embeddedPassword = 'brasa-e2e';
const embeddedDatabase = 'brasa_e2e';

const e2ePort = Number(process.env.E2E_PORT ?? 3200);

// Arranca un PostgreSQL embebido en la carpeta temporal y devuelve su URL
const startEmbeddedDatabase = async () => {
  const postgres = new EmbeddedPostgres({
    databaseDir: path.join(dataDir, 'pgdata'),
    user: embeddedUser,
    password: embeddedPassword,
    port: embeddedPort,
    persistent: false,
    onLog: () => {},
  });
  await postgres.initialise();
  await postgres.start();
  await postgres.createDatabase(embeddedDatabase);
  const url = `postgres://${embeddedUser}:${embeddedPassword}@127.0.0.1:${embeddedPort}/${embeddedDatabase}`;
  return {url, stop: () => postgres.stop()};
};

// Deja la base vacía para que cada corrida empiece con los mismos datos demo
const resetSchema = async (url) => {
  const client = new pg.Client({connectionString: url});
  await client.connect();
  await client.query('DROP SCHEMA public CASCADE');
  await client.query('CREATE SCHEMA public');
  await client.end();
};

// Levanta la base, la API con el frontend compilado y los datos demo
const startE2eServer = async () => {
  if (!existsSync(path.join(staticDir, 'index.html'))) {
    throw new Error('Falta el build del frontend: corra npm run build antes de las pruebas end to end');
  }
  await rm(dataDir, {recursive: true, force: true});
  await mkdir(dataDir, {recursive: true});
  let database = {url: process.env.E2E_DATABASE_URL, stop: async () => {}};
  if (!database.url) {
    database = await startEmbeddedDatabase();
  }
  await resetSchema(database.url);
  const api = await startServer({
    NODE_ENV: 'test',
    PORT: String(e2ePort),
    DATABASE_URL: database.url,
    STATIC_DIR: staticDir,
    UPLOADS_DIR: path.join(dataDir, 'uploads'),
    CORS_ORIGINS: `http://127.0.0.1:${e2ePort}`,
    MAIL_DRIVER: 'console',
    RATE_LIMIT_ENABLED: 'false',
  });
  const db = createDb(createPool(database.url));
  await seedDemoData(db);
  await db.close();

  // Detiene la API y la base; la carpeta temporal se limpia al empezar la próxima corrida
  const stop = async () => {
    await api.stop();
    await database.stop();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
};

await startE2eServer();
