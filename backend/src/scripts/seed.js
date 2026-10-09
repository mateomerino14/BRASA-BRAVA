import {loadConfig} from '../config/env.js';
import {createDb, createPool} from '../db/pool.js';
import {runMigrations} from '../db/migrate.js';
import {seedDemoData} from '../db/seed.js';

const config = loadConfig();
const db = createDb(createPool(config.DATABASE_URL));
await runMigrations(db);
const seeded = await seedDemoData(db);
if (seeded) {
  console.info('Datos de demostración cargados');
}
else {
  console.info('La base ya tenía datos; no se cargó nada');
}
await db.close();
