import {Router} from 'express';
import {validate} from '../../middlewares/validate.js';
import {authenticate, authorize} from '../../middlewares/auth.js';
import {uploadImage} from '../../middlewares/upload.js';
import {createEmployeesRepository} from './employees.repository.js';
import {createEmployeesService} from './employees.service.js';
import {createEmployeesController} from './employees.controller.js';
import {createEmployeeSchema, idParamSchema, listQuerySchema, statusSchema, updateEmployeeSchema} from './employees.schemas.js';

// Declara las rutas /api/employees, protegidas con el permiso "empleados"
export const createEmployeesRouter = ({db, config, images}) => {
  const controller = createEmployeesController(createEmployeesService({repository: createEmployeesRepository(db), images}));
  const router = Router();
  router.use(authenticate(config.JWT_SECRET), authorize('empleados'));

  router.get('/', validate(listQuerySchema, 'query'), controller.list);
  router.get('/:id', validate(idParamSchema, 'params'), controller.getById);
  router.post('/', validate(createEmployeeSchema), controller.create);
  router.put('/:id', validate(idParamSchema, 'params'), validate(updateEmployeeSchema), controller.update);
  router.patch('/:id/status', validate(idParamSchema, 'params'), validate(statusSchema), controller.setStatus);
  router.put('/:id/image', validate(idParamSchema, 'params'), uploadImage, controller.setImage);
  router.delete('/:id/image', validate(idParamSchema, 'params'), controller.removeImage);

  return router;
};
