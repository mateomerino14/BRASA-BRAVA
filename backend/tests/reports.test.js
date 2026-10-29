import request from 'supertest';
import {afterEach, describe, expect, it} from 'vitest';
import {createTestApp} from './helpers/testApp.js';
import {loginAs} from './helpers/session.js';
import {createReportsRepository} from '../src/modules/reports/reports.repository.js';
import {createReportsService} from '../src/modules/reports/reports.service.js';
import {lastDueSlot, nextSlot} from '../src/modules/reports/schedule.js';

const TZ = 'America/La_Paz';
// Martes 13 de octubre de 2026, 20:00 en La Paz
const NOW = new Date('2026-10-14T00:00:00Z');
const silent = {error: () => {}};

describe('Reportes de ventas', () => {
  let ctx;
  let now;
  let admin;

  const start = async () => {
    now = NOW;
    ctx = await createTestApp({clock: () => now});
    admin = await loginAs(ctx.app, 'admin');
  };
  afterEach(() => ctx.db.close());

  const api = (method, url, session = admin) => request(ctx.app)[method](url).set('authorization', session.authorization);
  const tableId = async (name) => (await ctx.db.query('SELECT id_mesa FROM mesa WHERE nombre = $1', [name])).rows[0].id_mesa;
  const employeeId = async (alias) => (await ctx.db.query('SELECT id_empleado FROM empleado WHERE alias = $1', [alias])).rows[0].id_empleado;
  // Cobra las dos mesas abiertas del demo: Mesa 2 (Bs 160, efectivo) y Terraza 1 (Bs 103, QR)
  const closeDemoSales = async () => {
    const cajero = await loginAs(ctx.app, 'a.romero');
    await ctx.db.query('UPDATE venta_detalle SET listos = cantidad');
    await api('post', `/api/sales/tables/${await tableId('Mesa 2')}/checkout`, cajero).send({pagos: [{metodo: 'efectivo', monto: 160}], recibido: 200});
    await api('post', `/api/sales/tables/${await tableId('Terraza 1')}/checkout`, admin).send({pagos: [{metodo: 'qr', monto: 103}]});
  };
  const query = (extra = '') => `desde=2026-10-13&hasta=2026-10-13${extra}`;

  it('exige el permiso de reportes', async () => {
    await start();
    const cajero = await loginAs(ctx.app, 'a.romero');
    expect((await api('get', `/api/reports/sales?${query()}`, cajero)).status).toBe(403);
    expect(admin.user.permissions).toContain('reportes');
    expect((await api('get', `/api/reports/sales?${query()}`)).status).toBe(200);
  });

  it('arma el resumen por día y cada venta con sus envíos, líneas, lo quitado, pagos e impresiones', async () => {
    await start();
    await closeDemoSales();
    const res = await api('get', `/api/reports/sales?${query('&tipo=detalle')}`);
    expect(res.status).toBe(200);
    const {reporte} = res.body;
    expect(reporte).toMatchObject({tipo: 'detalle', periodo: '13/10/2026', empleado: 'Todos los empleados'});
    expect(reporte.resumen).toEqual({cantidad: 2, total: 263, efectivo: 160, qr: 103, promedio: 131.5});
    expect(reporte.dias).toEqual([{fecha: '2026-10-13', ventas: 2, efectivo: 160, qr: 103, total: 263}]);
    const mesa2 = reporte.ventas.find((sale) => sale.mesa === 'Mesa 2');
    expect(mesa2).toMatchObject({abrio: 'a.romero', cobrador: 'a.romero', recibido: 200, cambio: 40, impresiones: 0});
    const lines = mesa2.envios[0].lineas;
    expect(lines.find((line) => line.sin === 'Sin tomate')).toMatchObject({nombre: 'Hamburguesa Clásica', cantidad: 1, consumo: 'local'});
    expect(lines.find((line) => line.tipo === 'promocion').productos).toContain('Doble Brava');
  });

  it('filtra por empleado: ventas que registró, agregó o cobró', async () => {
    await start();
    await closeDemoSales();
    const romero = await api('get', `/api/reports/sales?${query(`&empleado=${await employeeId('a.romero')}`)}`);
    expect(romero.body.reporte.resumen.cantidad).toBe(2);
    expect(romero.body.reporte.empleado).toBe('Andrea Romero');
    const mendoza = await api('get', `/api/reports/sales?${query(`&empleado=${await employeeId('c.mendoza')}`)}`);
    expect(mendoza.body.reporte.resumen.cantidad).toBe(0);
    const marco = await api('get', `/api/reports/sales?${query(`&empleado=${await employeeId('admin')}`)}`);
    expect(marco.body.reporte.ventas.map((sale) => sale.mesa)).toEqual(['Terraza 1']);
    expect((await api('get', `/api/reports/sales?${query('&empleado=9999')}`)).body.message).toBe('El empleado no existe');
    expect((await api('get', '/api/reports/sales?desde=2026-10-14&hasta=2026-10-13')).body.message).toBe('La fecha "hasta" no puede ser anterior a "desde"');
  });

  it('descarga el PDF y lo envía por correo como adjunto', async () => {
    await start();
    await closeDemoSales();
    for (const tipo of ['resumen', 'detalle']) {
      const pdf = await api('get', `/api/reports/sales.pdf?${query(`&tipo=${tipo}`)}`).buffer(true).parse((res, done) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => done(null, Buffer.concat(chunks)));
      });
      expect(pdf.status).toBe(200);
      expect(pdf.headers['content-type']).toBe('application/pdf');
      expect(pdf.headers['content-disposition']).toContain(`brasa-brava-${tipo}-2026-10-13-al-2026-10-13.pdf`);
      expect(pdf.body.subarray(0, 4).toString()).toBe('%PDF');
    }
    const sent = await api('post', '/api/reports/sales/email').send({desde: '2026-10-13', hasta: '2026-10-13', tipo: 'detalle', correo: 'Gerencia@BrasaBrava.bo'});
    expect(sent.status).toBe(200);
    const mail = ctx.mailer.outbox.at(-1);
    expect(mail).toMatchObject({to: 'gerencia@brasabrava.bo', subject: 'Brasa Brava · Ventas detalladas · 13/10/2026'});
    expect(mail.attachments[0].name).toBe('brasa-brava-detalle-2026-10-13-al-2026-10-13.pdf');
    expect(mail.attachments[0].content.subarray(0, 4).toString()).toBe('%PDF');
    expect((await api('post', '/api/reports/sales/email').send({desde: '2026-10-13', hasta: '2026-10-13', correo: 'nada'})).body.message).toBe('Ingrese un correo válido');
  });

  it('solo el DIRECTORIO programa envíos', async () => {
    await start();
    const body = {correo: 'gerencia@brasabrava.bo', tipo: 'resumen', dias: '0100100', hora: '08:00'};
    expect((await api('post', '/api/reports/schedules').send(body)).status).toBe(403);
    const directorio = await loginAs(ctx.app, 'DIRECTORIO');
    const created = await api('post', '/api/reports/schedules', directorio).send(body);
    expect(created.status).toBe(201);
    expect(created.body.programado).toMatchObject({correo: 'gerencia@brasabrava.bo', dias: '0100100', hora: '08:00', activo: true, ultimoEnvioEn: null});
    expect(new Date(created.body.programado.proximo).toISOString()).toBe('2026-10-15T12:00:00.000Z');
    const id = created.body.programado.id;
    expect((await api('post', '/api/reports/schedules', directorio).send({...body, dias: '0000000'})).body.message).toBe('Elija al menos un día');
    const paused = await api('patch', `/api/reports/schedules/${id}/status`, directorio).send({activo: false});
    expect(paused.body.programado).toMatchObject({activo: false, proximo: null});
    expect((await api('get', '/api/reports/schedules', directorio)).body.programados).toHaveLength(1);
    expect((await api('delete', `/api/reports/schedules/${id}`, directorio)).status).toBe(204);
    expect((await api('delete', `/api/reports/schedules/${id}`, directorio)).status).toBe(404);
  });

  it('envía el programado en su turno, recupera el que se perdió con el sistema apagado y cada envío trae desde el anterior', async () => {
    await start();
    const service = createReportsService({repository: createReportsRepository(ctx.db), mailer: ctx.mailer, clock: () => now, timeZone: TZ, logger: silent});
    const directorio = await loginAs(ctx.app, 'DIRECTORIO');
    await api('post', '/api/reports/schedules', directorio).send({correo: 'dueno@gmail.com', tipo: 'resumen', dias: '1111111', hora: '21:00'});
    expect(await service.runDue()).toEqual([]);
    await closeDemoSales();
    // El sistema estuvo apagado a las 21:00 y se enciende al día siguiente a las 9:12
    now = new Date('2026-10-14T13:12:00Z');
    expect(await service.runDue()).toHaveLength(1);
    expect(await service.runDue()).toEqual([]);
    const [first] = ctx.mailer.outbox.slice(-1);
    expect(first.subject).toContain('Resumen de ventas · 12/10/2026 9:00 PM al 14/10/2026 9:12 AM');
    const row = (await ctx.db.query('SELECT ultimo_atrasado, ultimo_hasta, ultimo_turno FROM reporte_programado')).rows[0];
    expect(row.ultimo_atrasado).toBe(true);
    expect(new Date(row.ultimo_turno).toISOString()).toBe('2026-10-14T01:00:00.000Z');
    now = new Date('2026-10-15T01:00:30Z');
    expect(await service.runDue()).toHaveLength(1);
    expect(ctx.mailer.outbox.at(-1).subject).toContain('14/10/2026 9:12 AM al 14/10/2026 9:00 PM');
  });

});

describe('Turnos de los envíos programados', () => {
  it('calcula el último y el próximo turno en la hora del local', () => {
    const schedule = {dias: '0100100', hora: '08:00'};
    expect(lastDueSlot(schedule, NOW, TZ).toISOString()).toBe('2026-10-12T12:00:00.000Z');
    expect(nextSlot(schedule, NOW, TZ).toISOString()).toBe('2026-10-15T12:00:00.000Z');
    expect(lastDueSlot({dias: '0000000', hora: '08:00'}, NOW, TZ)).toBeNull();
  });
});
