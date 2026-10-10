import {respond} from '../../utils/respond.js';

// Controladores HTTP de Caja
export const createSalesController = (service) => ({
  // Plano de mesas con su ocupación
  floor: async (_req, res) => res.json(await service.floor()),

  // Productos y promociones que se pueden vender hoy
  catalog: async (_req, res) => res.json(await service.catalog()),

  // Empleados que pueden atender mesas
  waiters: async (_req, res) => res.json(await service.waiters()),

  // Mesa con su venta abierta
  getTable: async (req, res) => {
    const result = await service.getTable(req.validated.params.idMesa);
    return respond(res, result, ({mesa, venta}) => res.json({mesa, venta}));
  },

  // Registra un envío de productos para la mesa
  addOrder: async (req, res) => {
    const result = await service.addOrder(req.validated.params.idMesa, req.validated.body, req.user);
    return respond(res, result, ({mesa, venta, created, envio, sinStock}) => res.status(201).json({mesa, venta, nueva: created, envio, sinStock}));
  },
});
