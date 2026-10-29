import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createDb, createPool} from '@brasa-brava/backend/db';
import {runMigrations} from '@brasa-brava/backend/migrate';
import {seedDemoData} from '@brasa-brava/backend/seed';
import {startServer} from '@brasa-brava/backend/server';
import {E2E_ENV, adminDatabaseUrl, databaseName} from '../e2e.config.js';

// Borra y vuelve a crear la base de pruebas para que cada corrida parta igual
const resetDatabase = async () => {
  const admin = createDb(createPool(adminDatabaseUrl));
  await admin.query(`DROP DATABASE IF EXISTS ${databaseName} WITH (FORCE)`);
  await admin.query(`CREATE DATABASE ${databaseName}`);
  await admin.close();
};

// Aplica las migraciones y carga los datos de demostración
const seedDatabase = async () => {
  const db = createDb(createPool(E2E_ENV.DATABASE_URL));
  await runMigrations(db);
  await seedDemoData(db);
  await db.close();
};

await resetDatabase();
await seedDatabase();
await startServer({...E2E_ENV, UPLOADS_DIR: mkdtempSync(path.join(tmpdir(), 'brasa-e2e-'))});
