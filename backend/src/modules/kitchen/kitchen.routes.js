import {Router} from 'express';
import {validate} from '../../middlewares/validate.js';
import {authenticate, authorize} from '../../middlewares/auth.js';
import {createKitchenRepository} from './kitchen.repository.js';
import {createKitchenService} from './kitchen.service.js';
import {createKitchenController} from './kitchen.controller.js';
import {lineActionSchema, lineParamSchema, shipmentActionSchema, shipmentParamSchema} from './kitchen.schemas.js';

// Declara las rutas /api/kitchen, protegidas con el permiso "cocina"
export const createKitchenRouter = ({db, config}) => {
  const controller = createKitchenController(createKitchenService({repository: createKitchenRepository(db)}));
  const router = Router();
  router.use(authenticate(config.JWT_SECRET), authorize('cocina'));

  router.get('/orders', controller.orders);
  router.patch('/lines/:id', validate(lineParamSchema, 'params'), validate(lineActionSchema), controller.markLine);
  router.patch('/shipments/:idVenta/:envio', validate(shipmentParamSchema, 'params'), validate(shipmentActionSchema), controller.markShipment);

  return router;
};
