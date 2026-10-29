import {respond} from '../../utils/respond.js';

// Controladores HTTP de cocina
export const createKitchenController = (service) => ({
  // Envíos de las ventas abiertas con su avance
  orders: async (_req, res) => res.json(await service.orders()),

  // Cambia las unidades listas de una línea
  markLine: async (req, res) => {
    const result = await service.markLine(req.validated.params.id, req.validated.body.accion);
    return respond(res, result, (data) => res.json(data));
  },

  // Marca un envío completo como listo o en preparación
  markShipment: async (req, res) => {
    const {idVenta, envio} = req.validated.params;
    const result = await service.markShipment(idVenta, envio, req.validated.body.accion);
    return respond(res, result, (data) => res.json(data));
  },
});
