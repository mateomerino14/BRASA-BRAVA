import {Router} from 'express';
import {z} from 'zod';
import {validate} from '../../middlewares/validate.js';
import {authenticate, authorize} from '../../middlewares/auth.js';
import {respond} from '../../utils/respond.js';
import {createCatalogRepository} from './catalog.repository.js';
import {createCatalogService} from './catalog.service.js';

const idParamSchema = z.object({id: z.coerce.number().int().positive('Producto inválido')});

// Declara las rutas /api/catalog, protegidas con el permiso "familia"
export const createCatalogRouter = ({db, config, clock}) => {
  const service = createCatalogService({repository: createCatalogRepository(db), clock, timeZone: config.TIMEZONE});
  const router = Router();
  router.use(authenticate(config.JWT_SECRET), authorize('familia'));

  // Catálogo completo: categorías, productos y promociones
  router.get('/', async (_req, res) => res.json(await service.catalog()));

  // Detalle de un producto con su receta y stock
  router.get('/products/:id', validate(idParamSchema, 'params'), async (req, res) => {
    const result = await service.product(req.validated.params.id);
    return respond(res, result, ({producto}) => res.json({producto}));
  });

  return router;
};
