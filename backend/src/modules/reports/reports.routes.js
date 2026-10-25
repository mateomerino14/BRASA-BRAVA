import {Router} from 'express';
import {validate} from '../../middlewares/validate.js';
import {authenticate, authorize} from '../../middlewares/auth.js';
import {createReportsRepository} from './reports.repository.js';
import {createReportsService} from './reports.service.js';
import {createReportsController} from './reports.controller.js';
import {reportEmailSchema, reportQuerySchema, scheduleParamSchema, scheduleSchema, scheduleStatusSchema} from './reports.schemas.js';

// Declara las rutas /api/reports, protegidas con el permiso "reportes" (los programados, solo el DIRECTORIO)
export const createReportsRouter = ({service}) => {
  const controller = createReportsController(service.reports);
  const byId = validate(scheduleParamSchema, 'params');
  const router = Router();
  router.use(authenticate(service.secret), authorize('reportes'));

  router.get('/employees', controller.employees);
  router.get('/sales', validate(reportQuerySchema, 'query'), controller.report);
  router.get('/sales.pdf', validate(reportQuerySchema, 'query'), controller.pdf);
  router.post('/sales/email', validate(reportEmailSchema), controller.email);
  router.get('/schedules', controller.schedules);
  router.post('/schedules', validate(scheduleSchema), controller.createSchedule);
  router.put('/schedules/:id', byId, validate(scheduleSchema), controller.updateSchedule);
  router.patch('/schedules/:id/status', byId, validate(scheduleStatusSchema), controller.setScheduleStatus);
  router.delete('/schedules/:id', byId, controller.deleteSchedule);
  router.post('/schedules/:id/send', byId, controller.sendScheduleNow);

  return router;
};

// Arma el servicio de reportes con sus dependencias
export const createReportsModule = ({db, mailer, config, clock, logger}) => ({
  reports: createReportsService({repository: createReportsRepository(db), mailer, clock, timeZone: config.TIMEZONE, logger}),
  secret: config.JWT_SECRET,
});
