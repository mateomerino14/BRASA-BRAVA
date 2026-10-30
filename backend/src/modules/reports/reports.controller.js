import {respond} from '../../utils/respond.js';

// Controladores HTTP de los reportes
export const createReportsController = (service) => ({
  // Empleados para el filtro
  employees: async (_req, res) => res.json(await service.employees()),

  // Reporte de ventas para ver en pantalla
  report: async (req, res) => {
    const result = await service.report(req.validated.query, req.user);
    return respond(res, result, ({reporte}) => res.json({reporte}));
  },

  // Reporte en PDF para descargar
  pdf: async (req, res) => {
    const result = await service.pdf(req.validated.query, req.user);
    return respond(res, result, ({buffer, filename}) => {
      res.setHeader('content-type', 'application/pdf');
      res.setHeader('content-disposition', `attachment; filename="${filename}"`);
      return res.send(buffer);
    });
  },

  // Envía el reporte por correo
  email: async (req, res) => {
    const result = await service.email(req.validated.body, req.user);
    return respond(res, result, ({correo, simulado}) => res.json({correo, simulado}));
  },

  // Envíos programados
  schedules: async (req, res) => {
    const result = await service.schedules(req.user);
    return respond(res, result, ({programados, correoConfigurado}) => res.json({programados, correoConfigurado}));
  },

  // Registra un envío programado
  createSchedule: async (req, res) => {
    const result = await service.createSchedule(req.validated.body, req.user);
    return respond(res, result, ({programado}) => res.status(201).json({programado}));
  },

  // Modifica un envío programado
  updateSchedule: async (req, res) => {
    const result = await service.updateSchedule(req.validated.params.id, req.validated.body, req.user);
    return respond(res, result, ({programado}) => res.json({programado}));
  },

  // Pausa o reactiva un envío programado
  setScheduleStatus: async (req, res) => {
    const result = await service.setScheduleStatus(req.validated.params.id, req.validated.body.activo, req.user);
    return respond(res, result, ({programado}) => res.json({programado}));
  },

  // Borra un envío programado
  deleteSchedule: async (req, res) => {
    const result = await service.deleteSchedule(req.validated.params.id, req.user);
    return respond(res, result, () => res.status(204).end());
  },

  // Envía un programado ahora
  sendScheduleNow: async (req, res) => {
    const result = await service.sendScheduleNow(req.validated.params.id, req.user);
    return respond(res, result, ({programado, simulado}) => res.json({programado, simulado}));
  },
});
