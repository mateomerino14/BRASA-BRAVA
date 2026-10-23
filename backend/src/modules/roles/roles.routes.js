import {Router} from 'express';
import {validate} from '../../middlewares/validate.js';
import {authenticate, authorize} from '../../middlewares/auth.js';
import {createRolesRepository} from './roles.repository.js';
import {createRolesService} from './roles.service.js';
import {createRolesController} from './roles.controller.js';
import {idParamSchema, listQuerySchema, roleSchema, statusSchema} from './roles.schemas.js';

// Declara las rutas /api/roles: opciones para empleados y gestión con el permiso "cargos"
export const createRolesRouter = ({db, config}) => {
  const service = createRolesService({
    repository: createRolesRepository(db),
    // Ejecuta el trabajo con un repositorio dentro de una transacción
    transaction: (work) => db.transaction((tx) => work(createRolesRepository(tx))),
  });
  const controller = createRolesController(service);
  const byId = validate(idParamSchema, 'params');
  const manage = authorize('cargos');
  const router = Router();
  router.use(authenticate(config.JWT_SECRET));

  router.get('/options', authorize('empleados'), controller.options);
  router.get('/', manage, validate(listQuerySchema, 'query'), controller.list);
  router.get('/:id', manage, byId, controller.getById);
  router.post('/', manage, validate(roleSchema), controller.create);
  router.put('/:id', manage, byId, validate(roleSchema), controller.update);
  router.patch('/:id/status', manage, byId, validate(statusSchema), controller.setStatus);

  return router;
};
