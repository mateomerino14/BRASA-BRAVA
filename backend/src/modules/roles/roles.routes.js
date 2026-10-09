import {Router} from 'express';
import {authenticate, authorize} from '../../middlewares/auth.js';
import {createRolesRepository} from './roles.repository.js';
import {createRolesService} from './roles.service.js';
import {createRolesController} from './roles.controller.js';

// Declara las rutas /api/roles, usadas por la gestión de empleados
export const createRolesRouter = ({db, config}) => {
  const controller = createRolesController(createRolesService({repository: createRolesRepository(db)}));
  const router = Router();
  router.get('/', authenticate(config.JWT_SECRET), authorize('empleados'), controller.list);
  return router;
};
