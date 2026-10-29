import {localDayRange, localToday} from '../../utils/calendar.js';
import {buildSalesReport} from './reportBuilder.js';
import {renderReportPdf} from './reportPdf.js';
import {dateTime, dayMonthYear, money} from './reportFormat.js';
import {lastDueSlot, nextSlot} from './schedule.js';

const TITLES = {resumen: 'Resumen de ventas', detalle: 'Ventas detalladas'};
const scheduleNotFound = {error: 'El envío programado no existe', status: 404};
const onlyDirectorio = {error: 'Solo el DIRECTORIO programa envíos', status: 403};
const employeeNotFound = {error: 'El empleado no existe', status: 400};
const MS_PER_MINUTE = 60_000;
// Un envío que falló se reintenta recién después de este tiempo
const RETRY_MS = 15 * MS_PER_MINUTE;
// Un turno atendido después de este tiempo se marca como enviado al encender
const LATE_MS = 10 * MS_PER_MINUTE;
// Largo máximo del error guardado de un envío fallido
const MAX_ERROR_LENGTH = 200;

// Período legible de un rango de fechas: "20/10/2026 al 23/10/2026" o un solo día
const datesText = (desde, hasta) => {
  if (desde === hasta) {
    return dayMonthYear(desde);
  }
  return `${dayMonthYear(desde)} al ${dayMonthYear(hasta)}`;
};

// Nombre del archivo PDF del reporte
const fileName = (tipo, from, to) => `brasa-brava-${tipo}-${from}-al-${to}.pdf`.replaceAll(/[^a-z0-9.-]/gi, '-');

// Cuerpo del correo con los totales del reporte adjunto
const emailHtml = (report, meta) => `
  <div style="font-family:Arial,sans-serif;color:#1a1a1a">
    <h2 style="margin:0 0 4px">Brasa Brava · ${TITLES[meta.tipo]}</h2>
    <p style="margin:0 0 12px;color:#6b6b6b">Período: ${meta.periodo} · Empleado: ${meta.empleado}</p>
    <p style="margin:0">Ventas: <strong>${report.resumen.cantidad}</strong> · Total: <strong>Bs ${money(report.resumen.total)}</strong>
      · Efectivo: Bs ${money(report.resumen.efectivo)} · QR: Bs ${money(report.resumen.qr)}</p>
    <p style="margin:12px 0 0;color:#6b6b6b">El detalle va en el PDF adjunto.</p>
  </div>`;

// Envío programado como lo ve la pantalla
const toSchedule = (row, now, timeZone) => {
  let proximo = null;
  if (row.activo) {
    proximo = nextSlot(row, now, timeZone);
  }
  return {
    id: row.id_programado,
    correo: row.correo,
    tipo: row.tipo,
    dias: row.dias,
    hora: row.hora,
    activo: row.activo,
    ultimoEnvioEn: row.ultimo_envio_en,
    ultimoHasta: row.ultimo_hasta,
    ultimoAtrasado: row.ultimo_atrasado,
    ultimoTurno: row.ultimo_turno,
    ultimoError: row.ultimo_error,
    proximo,
  };
};

// Reglas de los reportes de ventas: armado, PDF, correo y envíos programados
export const createReportsService = ({repository, mailer, clock, timeZone, logger = console}) => {
  // Ventas cobradas de un período con todo lo que necesita el reporte
  const loadData = async (start, end) => {
    const sales = await repository.closedSales(start, end);
    const ids = sales.map((sale) => sale.id_venta);
    const [payments, shipments, details, exclusions, comboProducts, prints] = await Promise.all([
      repository.payments(ids), repository.shipments(ids), repository.details(ids), repository.exclusions(ids), repository.comboProducts(ids), repository.prints(ids),
    ]);
    return {sales, payments, shipments, details, exclusions, comboProducts, prints};
  };

  // Nombre del filtro de empleado para la cabecera
  const employeeLabel = async (empleado) => {
    if (empleado === 'todos') {
      return 'Todos los empleados';
    }
    if (empleado === 'directorio') {
      return 'DIRECTORIO';
    }
    const employee = await repository.findEmployee(empleado);
    if (!employee) {
      return null;
    }
    return `${employee.nombre} ${employee.apellido}`;
  };

  // Arma el reporte de un período (instantes UTC) con su cabecera
  const build = async ({tipo, empleado, start, end, periodo, generadoPor}) => {
    const label = await employeeLabel(empleado);
    if (!label) {
      return employeeNotFound;
    }
    const report = buildSalesReport(await loadData(start, end), {empleado, timeZone});
    const meta = {tipo, periodo, empleado: label, generado: `${dateTime(clock(), timeZone)} por ${generadoPor}`};
    return {report, meta};
  };

  // Reporte de un rango de fechas del local
  const byDates = ({tipo, empleado, desde, hasta}, user) => build({
    tipo,
    empleado,
    start: localDayRange(desde, timeZone).start,
    end: localDayRange(hasta, timeZone).end,
    periodo: datesText(desde, hasta),
    generadoPor: user.alias,
  });

  // Reporte para ver en pantalla
  const report = async (query, user) => {
    const result = await byDates(query, user);
    if (result.error) {
      return result;
    }
    return {reporte: {...result.report, ...result.meta, desde: query.desde, hasta: query.hasta}};
  };

  // Reporte en PDF para descargar
  const pdf = async (query, user) => {
    const result = await byDates(query, user);
    if (result.error) {
      return result;
    }
    return {buffer: await renderReportPdf(result.report, result.meta, timeZone), filename: fileName(query.tipo, query.desde, query.hasta)};
  };

  // Manda un reporte armado por correo con el PDF adjunto
  const mail = async (correo, {report, meta}, name) => {
    await mailer.send({
      to: correo,
      subject: `Brasa Brava · ${TITLES[meta.tipo]} · ${meta.periodo}`,
      html: emailHtml(report, meta),
      attachments: [{name, content: await renderReportPdf(report, meta, timeZone)}],
    });
  };

  // Reporte de un rango de fechas enviado al correo indicado
  const email = async ({correo, ...query}, user) => {
    const result = await byDates(query, user);
    if (result.error) {
      return result;
    }
    try {
      await mail(correo, result, fileName(query.tipo, query.desde, query.hasta));
    }
    catch (problem) {
      logger.error?.(problem);
      return {error: 'No se pudo enviar el correo. Revise la conexión e intente de nuevo', status: 502};
    }
    return {correo};
  };

  // Empleados para el filtro del reporte
  const employees = async () => ({
    empleados: (await repository.employees()).map((row) => ({id: row.id_empleado, nombre: `${row.nombre} ${row.apellido}`, alias: row.alias, activo: row.activo})),
  });

  // Envía un programado con las ventas desde el envío anterior hasta ahora
  const sendSchedule = async (row, {turno, now, manual = false}) => {
    let start = row.ultimo_hasta;
    if (!start) {
      const before = lastDueSlot(row, new Date((turno ?? now).getTime() - 1), timeZone);
      start = before ?? row.creado_en;
    }
    const startDate = new Date(start);
    const result = await build({
      tipo: row.tipo,
      empleado: 'todos',
      start: startDate,
      end: now,
      periodo: `${dateTime(startDate, timeZone)} al ${dateTime(now, timeZone)}`,
      generadoPor: 'envío programado',
    });
    await mail(row.correo, result, fileName(row.tipo, localToday(startDate, timeZone).date, localToday(now, timeZone).date));
    let atrasado = false;
    if (turno && !manual) {
      atrasado = now.getTime() - turno.getTime() > LATE_MS;
    }
    await repository.markSent(row.id_programado, {turno, hasta: now, enviadoEn: now, atrasado});
  };

  // Revisa los programados y envía los que tienen un turno pendiente (también los que se perdieron con el sistema apagado)
  const runDue = async () => {
    const now = clock();
    const sent = [];
    for (const row of await repository.schedules()) {
      if (!row.activo) {
        continue;
      }
      const turno = lastDueSlot(row, now, timeZone);
      const attended = new Date(row.ultimo_turno ?? row.creado_en).getTime();
      if (!turno || turno.getTime() <= attended) {
        continue;
      }
      if (row.ultimo_error && row.ultimo_intento_en && now.getTime() - new Date(row.ultimo_intento_en).getTime() < RETRY_MS) {
        continue;
      }
      try {
        await sendSchedule(row, {turno, now});
        sent.push(row.id_programado);
      }
      catch (problem) {
        logger.error?.(problem);
        await repository.markFailed(row.id_programado, {intentoEn: now, error: String(problem.message).slice(0, MAX_ERROR_LENGTH)});
      }
    }
    return sent;
  };

  // Solo el DIRECTORIO gestiona los envíos programados
  const guard = (user) => {
    if (!user.isDirectorio) {
      return onlyDirectorio;
    }
    return null;
  };

  const schedules = async (user) => {
    const problem = guard(user);
    if (problem) {
      return problem;
    }
    const now = clock();
    return {programados: (await repository.schedules()).map((row) => toSchedule(row, now, timeZone))};
  };

  // Devuelve un programado o el error si no existe
  const scheduleById = async (id) => {
    const row = await repository.findSchedule(id);
    if (!row) {
      return scheduleNotFound;
    }
    return {programado: toSchedule(row, clock(), timeZone)};
  };

  const createSchedule = async (data, user) => {
    const problem = guard(user);
    if (problem) {
      return problem;
    }
    return scheduleById(await repository.insertSchedule({...data, creadoEn: clock()}));
  };

  // Error si quien pide no es el DIRECTORIO o el programado no existe
  const editable = async (id, user) => {
    const problem = guard(user);
    if (problem) {
      return problem;
    }
    if (!await repository.findSchedule(id)) {
      return scheduleNotFound;
    }
    return null;
  };

  const updateSchedule = async (id, data, user) => {
    const problem = await editable(id, user);
    if (problem) {
      return problem;
    }
    await repository.updateSchedule(id, data);
    return scheduleById(id);
  };

  const setScheduleStatus = async (id, activo, user) => {
    const problem = await editable(id, user);
    if (problem) {
      return problem;
    }
    await repository.setScheduleActive(id, activo);
    return scheduleById(id);
  };

  const deleteSchedule = async (id, user) => {
    const problem = await editable(id, user);
    if (problem) {
      return problem;
    }
    await repository.deleteSchedule(id);
    return {id};
  };

  // Envía un programado ahora mismo; el próximo trae desde este envío
  const sendScheduleNow = async (id, user) => {
    const problem = guard(user);
    if (problem) {
      return problem;
    }
    const row = await repository.findSchedule(id);
    if (!row) {
      return scheduleNotFound;
    }
    const now = clock();
    try {
      await sendSchedule(row, {turno: lastDueSlot(row, now, timeZone), now, manual: true});
    }
    catch (problemSending) {
      logger.error?.(problemSending);
      return {error: 'No se pudo enviar el correo. Revise la conexión e intente de nuevo', status: 502};
    }
    return scheduleById(id);
  };

  return {report, pdf, email, employees, runDue, schedules, createSchedule, updateSchedule, setScheduleStatus, deleteSchedule, sendScheduleNow};
};
