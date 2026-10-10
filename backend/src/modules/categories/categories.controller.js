import {respond} from '../../utils/respond.js';
import {createImageHandlers} from '../shared/imageActions.js';

// Controladores HTTP de categorías y subcategorías
export const createCategoriesController = (service) => ({
  // Lista categorías con búsqueda, estado y paginación
  list: async (req, res) => {
    const result = await service.list(req.validated.query);
    return res.json(result);
  },

  // Devuelve el detalle de una categoría
  getById: async (req, res) => {
    const result = await service.getById(req.validated.params.id);
    return respond(res, result, ({category}) => res.json({category}));
  },

  // Registra una categoría con sus subcategorías
  create: async (req, res) => {
    const result = await service.create(req.validated.body);
    return respond(res, result, ({category}) => res.status(201).json({category}));
  },

  // Modifica una categoría y sus subcategorías
  update: async (req, res) => {
    const result = await service.update(req.validated.params.id, req.validated.body);
    return respond(res, result, ({category}) => res.json({category}));
  },

  // Da de baja o reactiva una categoría
  setStatus: async (req, res) => {
    const result = await service.setStatus(req.validated.params.id, req.validated.body.activo);
    return respond(res, result, ({category}) => res.json({category}));
  },

  ...createImageHandlers(service, 'category'),
});
