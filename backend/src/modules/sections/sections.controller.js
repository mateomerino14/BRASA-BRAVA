import {respond} from '../../utils/respond.js';

// Controladores HTTP de secciones y mesas
export const createSectionsController = (service) => ({
  // Lista secciones con búsqueda, estado, orden, paginación y resumen
  list: async (req, res) => res.json(await service.list(req.validated.query)),

  // Devuelve una sección con sus mesas
  getById: async (req, res) => {
    const result = await service.getById(req.validated.params.id);
    return respond(res, result, ({section}) => res.json({section}));
  },

  // Registra una sección con sus mesas
  create: async (req, res) => {
    const result = await service.create(req.validated.body);
    return respond(res, result, ({section}) => res.status(201).json({section}));
  },

  // Modifica una sección y sus mesas
  update: async (req, res) => {
    const result = await service.update(req.validated.params.id, req.validated.body);
    return respond(res, result, ({section}) => res.json({section}));
  },

  // Da de baja o reactiva una sección
  setStatus: async (req, res) => {
    const result = await service.setStatus(req.validated.params.id, req.validated.body.activo);
    return respond(res, result, ({section}) => res.json({section}));
  },
});
