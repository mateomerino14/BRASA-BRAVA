import {Router} from 'express';
import {validate} from '../../middlewares/validate.js';
import {authenticate, authorize} from '../../middlewares/auth.js';
import {createSalesRepository} from './sales.repository.js';
import {createSalesService} from './sales.service.js';
import {createSalesController} from './sales.controller.js';
import {orderSchema, tableParamSchema} from './sales.schemas.js';

// Declara las rutas /api/sales, protegidas con el permiso "caja"
export const createSalesRouter = ({db, config, clock}) => {
  const service = createSalesService({
    repository: createSalesRepository(db),
    transaction: (work) => db.transaction((tx) => work(createSalesRepository(tx))),
    clock,
    timeZone: config.TIMEZONE,
  });
  const controller = createSalesController(service);
  const byTable = validate(tableParamSchema, 'params');
  const router = Router();
  router.use(authenticate(config.JWT_SECRET), authorize('caja'));

  router.get('/floor', controller.floor);
  router.get('/catalog', controller.catalog);
  router.get('/waiters', controller.waiters);
  router.get('/tables/:idMesa', byTable, controller.getTable);
  router.post('/tables/:idMesa/orders', byTable, validate(orderSchema), controller.addOrder);

  return router;
};
