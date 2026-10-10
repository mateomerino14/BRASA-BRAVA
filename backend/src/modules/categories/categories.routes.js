import {Router} from 'express';
import {validate} from '../../middlewares/validate.js';
import {authenticate, authorize} from '../../middlewares/auth.js';
import {uploadImage} from '../../middlewares/upload.js';
import {createCategoriesRepository} from './categories.repository.js';
import {createCategoriesService} from './categories.service.js';
import {createCategoriesController} from './categories.controller.js';
import {categorySchema, idParamSchema, listQuerySchema, statusSchema} from './categories.schemas.js';

// Declara las rutas /api/categories, protegidas con el permiso "categorias"
export const createCategoriesRouter = ({db, config, images}) => {
  const service = createCategoriesService({
    repository: createCategoriesRepository(db),
    transaction: (work) => db.transaction((tx) => work(createCategoriesRepository(tx))),
    images,
  });
  const controller = createCategoriesController(service);
  const byId = validate(idParamSchema, 'params');
  const router = Router();
  router.use(authenticate(config.JWT_SECRET), authorize('categorias'));

  router.get('/', validate(listQuerySchema, 'query'), controller.list);
  router.get('/:id', byId, controller.getById);
  router.post('/', validate(categorySchema), controller.create);
  router.put('/:id', byId, validate(categorySchema), controller.update);
  router.patch('/:id/status', byId, validate(statusSchema), controller.setStatus);
  router.put('/:id/image', byId, uploadImage, controller.setImage);
  router.delete('/:id/image', byId, controller.removeImage);

  return router;
};
