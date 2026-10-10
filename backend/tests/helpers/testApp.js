import {mkdtemp} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {DataType, newDb} from 'pg-mem';
import pg from 'pg';
import {createApp} from '../../src/app.js';
import {loadConfig} from '../../src/config/env.js';
import {createDb} from '../../src/db/pool.js';
import {runMigrations} from '../../src/db/migrate.js';
import {seedDemoData} from '../../src/db/seed.js';
import {createConsoleMailer} from '../../src/services/mailer.js';

const silentLogger = {info: () => {}, error: () => {}};

// Crea una base nueva: Postgres real si hay TEST_DATABASE_URL, si no una en memoria (pg-mem)
const createTestDb = async () => {
  if (process.env.TEST_DATABASE_URL) {
    const pool = new pg.Pool({connectionString: process.env.TEST_DATABASE_URL});
    await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    return createDb(pool);
  }
  const memory = newDb();
  // pg-mem no trae FLOOR; PostgreSQL real sí (se usa para calcular porciones)
  for (const type of [DataType.float, DataType.decimal]) {
    memory.public.registerFunction({name: 'floor', args: [type], returns: type, implementation: Math.floor});
  }
  const {Pool} = memory.adapters.createPg();
  return createDb(new Pool());
};

// Levanta la app completa con base migrada, datos demo y mailer en memoria
export const createTestApp = async ({mailer: customMailer} = {}) => {
  const db = await createTestDb();
  await runMigrations(db);
  await seedDemoData(db);
  const config = loadConfig({
    NODE_ENV: 'test',
    RATE_LIMIT_ENABLED: 'false',
    JWT_SECRET: 'test-secret-1234567890',
    UPLOADS_DIR: await mkdtemp(path.join(os.tmpdir(), 'brasa-uploads-')),
  });
  const mailer = customMailer ?? createConsoleMailer(silentLogger);
  const app = createApp({db, mailer, config, logger: silentLogger});
  return {app, db, mailer, config};
};
