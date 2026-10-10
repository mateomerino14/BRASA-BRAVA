import {Router} from 'express';
import {validate} from '../../middlewares/validate.js';
import {authenticate, authorize} from '../../middlewares/auth.js';
import {createSectionsRepository} from './sections.repository.js';
import {createSectionsService} from './sections.service.js';
import {createSectionsController} from './sections.controller.js';
import {idParamSchema, listQuerySchema, sectionSchema, statusSchema} from './sections.schemas.js';

// Declara las rutas /api/sections, protegidas con el permiso "secciones"
export const createSectionsRouter = ({db, config}) => {
  const service = createSectionsService({
    repository: createSectionsRepository(db),
    transaction: (work) => db.transaction((tx) => work(createSectionsRepository(tx))),
  });
  const controller = createSectionsController(service);
  const byId = validate(idParamSchema, 'params');
  const router = Router();
  router.use(authenticate(config.JWT_SECRET), authorize('secciones'));

  router.get('/', validate(listQuerySchema, 'query'), controller.list);
  router.get('/:id', byId, controller.getById);
  router.post('/', validate(sectionSchema), controller.create);
  router.put('/:id', byId, validate(sectionSchema), controller.update);
  router.patch('/:id/status', byId, validate(statusSchema), controller.setStatus);

  return router;
};
