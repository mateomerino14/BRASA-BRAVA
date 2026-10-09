import {readdir, readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../database/migrations',
);

// Lista los archivos .sql de migración en orden alfabético
export const listMigrations = async (dir = MIGRATIONS_DIR) =>
  (await readdir(dir)).filter((file) => file.endsWith('.sql')).sort();

// Aplica las migraciones pendientes y devuelve los nombres aplicados
export const runMigrations = async (db, dir = MIGRATIONS_DIR) => {
  await db.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    nombre VARCHAR(255) PRIMARY KEY,
    aplicada_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  const {rows} = await db.query('SELECT nombre FROM schema_migrations');
  const applied = new Set(rows.map((row) => row.nombre));
  const pending = (await listMigrations(dir)).filter((file) => !applied.has(file));
  for (const file of pending) {
    const sql = await readFile(path.join(dir, file), 'utf8');
    await db.query(sql);
    await db.query('INSERT INTO schema_migrations (nombre) VALUES ($1)', [file]);
  }
  return pending;
};
