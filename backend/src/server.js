import {pathToFileURL} from 'node:url';
import {createApp} from './app.js';
import {loadConfig} from './config/env.js';
import {createDb, createPool} from './db/pool.js';
import {runMigrations} from './db/migrate.js';
import {ensureDirectorio} from './db/bootstrap.js';
import {createMailer} from './services/mailer.js';
import {cleanUnusedImages} from './services/imageCleanup.js';
import {startReportScheduler} from './services/reportScheduler.js';

// Arranca la API: aplica migraciones y escucha en el puerto configurado
export const startServer = async (overrides = {}) => {
  const config = loadConfig({...process.env, ...overrides});
  const db = createDb(createPool(config.DATABASE_URL));
  await runMigrations(db);
  await ensureDirectorio(db);
  await cleanUnusedImages({db, directory: config.UPLOADS_DIR});
  const mailer = createMailer(config);
  const app = createApp({db, mailer, config});
  const server = await new Promise((resolve) => {
    const instance = app.listen(config.PORT, '127.0.0.1', () => resolve(instance));
  });
  console.info(`API Brasa Brava escuchando en http://127.0.0.1:${config.PORT}`);
  const scheduler = startReportScheduler({db, mailer, config});
  return {
    server,
    // Detiene el servidor y cierra la conexión a la base
    stop: async () => {
      scheduler.stop();
      await new Promise((resolve) => server.close(resolve));
      await db.close();
    },
  };
};

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  startServer().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
