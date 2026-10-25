import {respond} from '../../utils/respond.js';

// Controladores HTTP de la eliminación física
export const createDeletionController = (service) => ({
  // Registros que se pueden eliminar de un tipo
  candidates: async (req, res) => res.json(await service.candidates(req.validated.params.tipo, req.validated.query)),

  // Lo que se borraría con la selección
  preview: async (req, res) => res.json(await service.preview(req.validated.body)),

  // Borra para siempre la selección y lo que arrastra
  execute: async (req, res) => {
    const result = await service.execute(req.validated.body);
    return respond(res, result, ({borrados}) => res.json({borrados}));
  },
});
