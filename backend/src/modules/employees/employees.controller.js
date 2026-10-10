import {respond} from '../../utils/respond.js';
import {createImageHandlers} from '../shared/imageActions.js';

// Controladores HTTP de la gestión de empleados
export const createEmployeesController = (service) => ({
  // Lista empleados con búsqueda, filtros y paginación
  list: async (req, res) => {
    const result = await service.list(req.validated.query);
    return res.json(result);
  },

  // Devuelve el detalle de un empleado
  getById: async (req, res) => {
    const result = await service.getById(req.validated.params.id);
    return respond(res, result, ({employee}) => res.json({employee}));
  },

  // Registra un empleado
  create: async (req, res) => {
    const result = await service.create(req.validated.body);
    return respond(res, result, ({employee}) => res.status(201).json({employee}));
  },

  // Modifica un empleado
  update: async (req, res) => {
    const result = await service.update(req.validated.params.id, req.validated.body);
    return respond(res, result, ({employee}) => res.json({employee}));
  },

  // Da de baja o reactiva un empleado
  setStatus: async (req, res) => {
    const result = await service.setStatus(req.validated.params.id, req.validated.body.activo, req.user);
    return respond(res, result, ({employee}) => res.json({employee}));
  },

  ...createImageHandlers(service, 'employee'),
});
