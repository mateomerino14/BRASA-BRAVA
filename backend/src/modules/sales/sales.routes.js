import {Router} from 'express';
import {validate} from '../../middlewares/validate.js';
import {authenticate, authorize} from '../../middlewares/auth.js';
import {createSalesRepository} from './sales.repository.js';
import {createSalesService} from './sales.service.js';
import {createSalesController} from './sales.controller.js';
import {createLimiter} from '../../middlewares/rateLimit.js';
import {checkoutSchema, orderSchema, printSchema, saleParamSchema, tableParamSchema} from './sales.schemas.js';

const printAttemptsLimit = 30;

// Declara las rutas /api/sales, protegidas con el permiso "caja"
export const createSalesRouter = ({db, config, clock}) => {
  const service = createSalesService({
    repository: createSalesRepository(db),
    // Ejecuta el trabajo con un repositorio dentro de una transacción
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
  router.get('/tables/:idMesa', byTable, controller.getTable);
  router.post('/tables/:idMesa/orders', byTable, validate(orderSchema), controller.addOrder);
  router.post('/tables/:idMesa/checkout', byTable, validate(checkoutSchema), controller.checkout);
  router.get('/today', controller.todaySales);
  router.get('/:idVenta/receipt', validate(saleParamSchema, 'params'), controller.receipt);
  router.post('/:idVenta/prints', createLimiter(config.RATE_LIMIT_ENABLED, printAttemptsLimit), validate(saleParamSchema, 'params'), validate(printSchema), controller.registerPrint);

  return router;
};
