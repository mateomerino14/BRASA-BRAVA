import {createReportsRepository} from '../modules/reports/reports.repository.js';
import {createReportsService} from '../modules/reports/reports.service.js';

const MINUTE_MS = 60000;

// Revisa cada minuto los envíos programados del reporte; al arrancar envía los que se perdieron con el sistema apagado
export const startReportScheduler = ({db, mailer, config, logger = console, clock = () => new Date(), intervalMs = MINUTE_MS}) => {
  const service = createReportsService({repository: createReportsRepository(db), mailer, clock, timeZone: config.TIMEZONE, logger});
  let running = false;
  const tick = async () => {
    if (running) {
      return [];
    }
    running = true;
    try {
      return await service.runDue();
    }
    catch (problem) {
      logger.error?.(problem);
      return [];
    }
    finally {
      running = false;
    }
  };
  tick();
  const timer = setInterval(tick, intervalMs);
  timer.unref?.();
  return {tick, stop: () => clearInterval(timer)};
};
