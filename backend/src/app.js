import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import {createAuthRouter} from './modules/auth/auth.routes.js';
import {createEmployeesRouter} from './modules/employees/employees.routes.js';
import {createRolesRouter} from './modules/roles/roles.routes.js';
import {createCategoriesRouter} from './modules/categories/categories.routes.js';
import {createProductsRouter} from './modules/products/products.routes.js';
import {createIngredientsRouter} from './modules/ingredients/ingredients.routes.js';
import {createSectionsRouter} from './modules/sections/sections.routes.js';
import {createPromotionsRouter} from './modules/promotions/promotions.routes.js';
import {createSalesRouter} from './modules/sales/sales.routes.js';
import {createKitchenRouter} from './modules/kitchen/kitchen.routes.js';
import {createSettingsRouter} from './modules/settings/settings.routes.js';
import {createCatalogRouter} from './modules/catalog/catalog.routes.js';
import {UPLOADS_ROUTE, createImageStorage} from './services/imageStorage.js';
import {errorHandler, notFoundHandler} from './middlewares/errorHandler.js';

// Construye la app Express con sus dependencias inyectadas (db, mailer, config)
export const createApp = ({db, mailer, config, logger = console, images = createImageStorage(config.UPLOADS_DIR), clock = () => new Date()}) => {
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
  app.use('/api/employees', createEmployeesRouter({db, config}));
  app.use('/api/roles', createRolesRouter({db, config}));
  app.use('/api/categories', createCategoriesRouter({db, config, images}));
  app.use('/api/products', createProductsRouter({db, config, images}));
  app.use('/api/ingredients', createIngredientsRouter({db, config}));
  app.use('/api/sections', createSectionsRouter({db, config}));
  app.use('/api/promotions', createPromotionsRouter({db, config, images, clock}));
  app.use('/api/sales', createSalesRouter({db, config, clock}));
  app.use('/api/kitchen', createKitchenRouter({db, config}));
  app.use('/api/settings', createSettingsRouter({db, config}));
  app.use('/api/catalog', createCatalogRouter({db, config, clock}));
  app.use('/api', notFoundHandler);
  app.use(UPLOADS_ROUTE, express.static(images.root, {maxAge: '7d'}), notFoundHandler);

  if (config.STATIC_DIR) {
    const staticDir = path.resolve(config.STATIC_DIR);
    app.use(express.static(staticDir));
    // Devuelve index.html para que el router del frontend maneje la ruta
    app.get('/{*splat}', (_req, res) => res.sendFile(path.join(staticDir, 'index.html')));
  }

  app.use(errorHandler(logger));
  return app;
};
