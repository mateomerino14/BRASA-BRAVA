import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import {createAuthRouter} from './modules/auth/auth.routes.js';
import {errorHandler, notFoundHandler} from './middlewares/errorHandler.js';

// Construye la app Express con sus dependencias inyectadas (db, mailer, config)
export const createApp = ({db, mailer, config, logger = console}) => {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 'loopback');
  app.use(helmet({contentSecurityPolicy: false}));
  app.use(cors({origin: config.corsOrigins}));
  app.use(express.json({limit: '1mb'}));

  // Indica si la API y la base de datos responden
  app.get('/api/health', async (_req, res) => {
    await db.query('SELECT 1');
    res.json({status: 'ok'});
  });

  app.use('/api/auth', createAuthRouter({db, mailer, config, logger}));
  app.use('/api', notFoundHandler);

  if (config.STATIC_DIR) {
    const staticDir = path.resolve(config.STATIC_DIR);
    app.use(express.static(staticDir));
    // Devuelve index.html para que el router del frontend maneje la ruta
    app.get('/{*splat}', (_req, res) => res.sendFile(path.join(staticDir, 'index.html')));
  }

  app.use(errorHandler(logger));
  return app;
};
