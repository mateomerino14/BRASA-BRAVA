import {respond} from '../../utils/respond.js';
import {createImageHandlers} from '../shared/imageActions.js';

// Controladores HTTP de productos
export const createProductsController = (service) => ({
  // Lista productos con búsqueda, filtros, orden y paginación
  list: async (req, res) => res.json(await service.list(req.validated.query)),

  // Categorías y subcategorías activas para el formulario
  options: async (_req, res) => res.json(await service.options()),

  // Devuelve el detalle de un producto
  getById: async (req, res) => {
    const result = await service.getById(req.validated.params.id);
    return respond(res, result, ({product}) => res.json({product}));
  },

  // Registra un producto
  create: async (req, res) => {
    const result = await service.create(req.validated.body);
    return respond(res, result, ({product}) => res.status(201).json({product}));
  },

  // Modifica un producto
  update: async (req, res) => {
    const result = await service.update(req.validated.params.id, req.validated.body);
    return respond(res, result, ({product}) => res.json({product}));
  },

  // Da de baja o reactiva un producto
  setStatus: async (req, res) => {
    const result = await service.setStatus(req.validated.params.id, req.validated.body.activo);
    return respond(res, result, ({product}) => res.json({product}));
  },

  // Marca un producto como disponible o agotado
  setAvailability: async (req, res) => {
    const result = await service.setAvailability(req.validated.params.id, req.validated.body.disponible);
    return respond(res, result, ({product}) => res.json({product}));
  },

  // Insumos activos para armar recetas
  recipeOptions: async (_req, res) => res.json(await service.recipeOptions()),

  // Devuelve la receta de un producto
  getRecipe: async (req, res) => {
    const result = await service.getRecipe(req.validated.params.id);
    return respond(res, result, ({recipe}) => res.json({recipe}));
  },

  // Guarda la receta completa de un producto
  saveRecipe: async (req, res) => {
    const result = await service.saveRecipe(req.validated.params.id, req.validated.body);
    return respond(res, result, ({recipe}) => res.json({recipe}));
  },

  ...createImageHandlers(service, 'product'),
});
