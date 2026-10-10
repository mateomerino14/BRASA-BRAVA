import {Router} from 'express';
import {validate} from '../../middlewares/validate.js';
import {authenticate, authorize} from '../../middlewares/auth.js';
import {createIngredientsRepository} from './ingredients.repository.js';
import {createIngredientsService} from './ingredients.service.js';
import {createIngredientsController} from './ingredients.controller.js';
import {createIngredientSchema, historyQuerySchema, idParamSchema, listQuerySchema, movementSchema, statusSchema, updateIngredientSchema} from './ingredients.schemas.js';

// Declara las rutas /api/ingredients, protegidas con el permiso "stock"
export const createIngredientsRouter = ({db, config}) => {
  const service = createIngredientsService({
    repository: createIngredientsRepository(db),
    transaction: (work) => db.transaction((tx) => work(createIngredientsRepository(tx))),
  });
  const controller = createIngredientsController(service);
  const byId = validate(idParamSchema, 'params');
  const router = Router();
  router.use(authenticate(config.JWT_SECRET), authorize('stock'));

  router.get('/', validate(listQuerySchema, 'query'), controller.list);
  router.get('/:id', byId, controller.getById);
  router.post('/', validate(createIngredientSchema), controller.create);
  router.put('/:id', byId, validate(updateIngredientSchema), controller.update);
  router.patch('/:id/status', byId, validate(statusSchema), controller.setStatus);
  router.post('/:id/movements', byId, validate(movementSchema), controller.addMovement);
  router.get('/:id/movements', byId, validate(historyQuerySchema, 'query'), controller.history);

  return router;
};
