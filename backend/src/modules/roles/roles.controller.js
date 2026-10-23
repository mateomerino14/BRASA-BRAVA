import {respond} from '../../utils/respond.js';

// Controladores HTTP de los cargos
export const createRolesController = (service) => ({
  // Lista los cargos activos para el formulario de empleados
  options: async (_req, res) => res.json(await service.listActive()),

  // Lista cargos con búsqueda, estado, orden, paginación y resumen
  list: async (req, res) => res.json(await service.list(req.validated.query)),

  // Devuelve un cargo con sus pantallas
  getById: async (req, res) => {
    const result = await service.getById(req.validated.params.id);
    return respond(res, result, ({role}) => res.json({role}));
  },

  // Registra un cargo con sus pantallas
  create: async (req, res) => {
    const result = await service.create(req.validated.body);
    return respond(res, result, ({role}) => res.status(201).json({role}));
  },

  // Modifica un cargo y sus pantallas
  update: async (req, res) => {
    const result = await service.update(req.validated.params.id, req.validated.body);
    return respond(res, result, ({role}) => res.json({role}));
  },

  // Da de baja o reactiva un cargo
  setStatus: async (req, res) => {
    const result = await service.setStatus(req.validated.params.id, req.validated.body.activo);
    return respond(res, result, ({role}) => res.json({role}));
  },
});
