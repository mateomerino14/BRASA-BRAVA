import {respond} from '../../utils/respond.js';
import {createImageHandlers} from '../shared/imageActions.js';

// Controladores HTTP de promociones
export const createPromotionsController = (service) => ({
  // Lista promociones con filtros, orden, paginación y resumen de vigencia
  list: async (req, res) => res.json(await service.list(req.validated.query)),

  // Productos activos para armar promociones
  productOptions: async (_req, res) => res.json(await service.productOptions()),

  // Devuelve una promoción
  getById: async (req, res) => {
    const result = await service.getById(req.validated.params.id);
    return respond(res, result, ({promotion}) => res.json({promotion}));
  },

  // Registra una promoción
  create: async (req, res) => {
    const result = await service.create(req.validated.body);
    return respond(res, result, ({promotion}) => res.status(201).json({promotion}));
  },

  // Modifica una promoción
  update: async (req, res) => {
    const result = await service.update(req.validated.params.id, req.validated.body);
    return respond(res, result, ({promotion}) => res.json({promotion}));
  },

  // Da de baja o reactiva una promoción
  setStatus: async (req, res) => {
    const result = await service.setStatus(req.validated.params.id, req.validated.body.activo);
    return respond(res, result, ({promotion}) => res.json({promotion}));
  },

  ...createImageHandlers(service, 'promotion'),
});
