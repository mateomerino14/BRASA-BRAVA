import {Router} from 'express';
import {validate} from '../../middlewares/validate.js';
import {authenticate, authorize} from '../../middlewares/auth.js';
import {uploadImage} from '../../middlewares/upload.js';
import {createProductsRepository} from './products.repository.js';
import {createProductsService} from './products.service.js';
import {createProductsController} from './products.controller.js';
import {availabilitySchema, idParamSchema, listQuerySchema, productSchema, statusSchema} from './products.schemas.js';

// Declara las rutas /api/products, protegidas con el permiso "productos"
export const createProductsRouter = ({db, config, images}) => {
  const service = createProductsService({repository: createProductsRepository(db), images});
  const controller = createProductsController(service);
  const byId = validate(idParamSchema, 'params');
  const router = Router();
  router.use(authenticate(config.JWT_SECRET), authorize('productos'));

  router.get('/', validate(listQuerySchema, 'query'), controller.list);
  router.get('/options', controller.options);
  router.get('/:id', byId, controller.getById);
  router.post('/', validate(productSchema), controller.create);
  router.put('/:id', byId, validate(productSchema), controller.update);
  router.patch('/:id/status', byId, validate(statusSchema), controller.setStatus);
  router.patch('/:id/availability', byId, validate(availabilitySchema), controller.setAvailability);
  router.put('/:id/image', byId, uploadImage, controller.setImage);
  router.delete('/:id/image', byId, controller.removeImage);

  return router;
};
