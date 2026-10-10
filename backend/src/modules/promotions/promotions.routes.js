import {Router} from 'express';
import {validate} from '../../middlewares/validate.js';
import {authenticate, authorize} from '../../middlewares/auth.js';
import {uploadImage} from '../../middlewares/upload.js';
import {createPromotionsRepository} from './promotions.repository.js';
import {createPromotionsService} from './promotions.service.js';
import {createPromotionsController} from './promotions.controller.js';
import {idParamSchema, listQuerySchema, promotionSchema, statusSchema} from './promotions.schemas.js';

// Declara las rutas /api/promotions, protegidas con el permiso "promociones"
export const createPromotionsRouter = ({db, config, images, clock}) => {
  const service = createPromotionsService({
    repository: createPromotionsRepository(db),
    transaction: (work) => db.transaction((tx) => work(createPromotionsRepository(tx))),
    images,
    clock,
    timeZone: config.TIMEZONE,
  });
  const controller = createPromotionsController(service);
  const byId = validate(idParamSchema, 'params');
  const router = Router();
  router.use(authenticate(config.JWT_SECRET), authorize('promociones'));

  router.get('/', validate(listQuerySchema, 'query'), controller.list);
  router.get('/product-options', controller.productOptions);
  router.get('/:id', byId, controller.getById);
  router.post('/', validate(promotionSchema), controller.create);
  router.put('/:id', byId, validate(promotionSchema), controller.update);
  router.patch('/:id/status', byId, validate(statusSchema), controller.setStatus);
  router.put('/:id/image', byId, uploadImage, controller.setImage);
  router.delete('/:id/image', byId, controller.removeImage);

  return router;
};
