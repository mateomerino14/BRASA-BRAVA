import {Router} from 'express';
import {validate} from '../../middlewares/validate.js';
import {authenticate, requireDirectorio} from '../../middlewares/auth.js';
import {createDeletionRepository} from './deletion.repository.js';
import {createDeletionService} from './deletion.service.js';
import {createDeletionController} from './deletion.controller.js';
import {candidatesQuerySchema, executeSchema, selectionSchema, typeParamSchema} from './deletion.schemas.js';

// Declara las rutas /api/deletion, solo para el DIRECTORIO
export const createDeletionRouter = ({db, config, images}) => {
  const service = createDeletionService({
    repository: createDeletionRepository(db),
    // Ejecuta el borrado con un repositorio dentro de una transacción
    transaction: (work) => db.transaction((tx) => work(createDeletionRepository(tx))),
    images,
    timeZone: config.TIMEZONE,
  });
  const controller = createDeletionController(service);
  const router = Router();
  router.use(authenticate(config.JWT_SECRET), requireDirectorio);

  router.get('/candidates/:tipo', validate(typeParamSchema, 'params'), validate(candidatesQuerySchema, 'query'), controller.candidates);
  router.post('/preview', validate(selectionSchema), controller.preview);
  router.post('/execute', validate(executeSchema), controller.execute);

  return router;
};
