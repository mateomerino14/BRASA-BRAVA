import {respond} from '../../utils/respond.js';

// Controladores HTTP de insumos y movimientos de stock
export const createIngredientsController = (service) => ({
  // Lista insumos con filtros, orden, paginación y resumen de alertas
  list: async (req, res) => res.json(await service.list(req.validated.query)),

  // Devuelve el detalle de un insumo
  getById: async (req, res) => {
    const result = await service.getById(req.validated.params.id);
    return respond(res, result, ({ingredient}) => res.json({ingredient}));
  },

  // Registra un insumo con stock inicial opcional
  create: async (req, res) => {
    const result = await service.create(req.validated.body, req.user);
    return respond(res, result, ({ingredient}) => res.status(201).json({ingredient}));
  },

  // Modifica un insumo
  update: async (req, res) => {
    const result = await service.update(req.validated.params.id, req.validated.body);
    return respond(res, result, ({ingredient}) => res.json({ingredient}));
  },

  // Da de baja o reactiva un insumo
  setStatus: async (req, res) => {
    const result = await service.setStatus(req.validated.params.id, req.validated.body.activo);
    return respond(res, result, ({ingredient}) => res.json({ingredient}));
  },

  // Registra una entrada, salida o ajuste
  addMovement: async (req, res) => {
    const result = await service.addMovement(req.validated.params.id, req.validated.body, req.user);
    return respond(res, result, ({ingredient}) => res.status(201).json({ingredient}));
  },

  // Devuelve el historial de movimientos
  history: async (req, res) => {
    const result = await service.history(req.validated.params.id, req.validated.query);
    return respond(res, result, (page) => res.json(page));
  },
});
