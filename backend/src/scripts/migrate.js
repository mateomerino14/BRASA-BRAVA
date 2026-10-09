import {loadConfig} from '../config/env.js';
import {createDb, createPool} from '../db/pool.js';
import {runMigrations} from '../db/migrate.js';

const config = loadConfig();
const db = createDb(createPool(config.DATABASE_URL));
const applied = await runMigrations(db);
if (applied.length > 0) {
  console.info(`Migraciones aplicadas: ${applied.join(', ')}`);
}
else {
  console.info('La base ya está al día');
}
await db.close();
