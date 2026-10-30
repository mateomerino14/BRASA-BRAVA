const MINUTE_MS = 60000;

const line = (cantidad, nombre, extra = {}) => ({cantidad, nombre, tipo: 'producto', consumo: 'local', productos: '', sin: '', subtotal: 35 * cantidad, ...extra});

const SALES = [
  {
    id: 41, numero: 41, abiertaEn: '2026-10-20T23:05:00Z', cerradaEn: '2026-10-21T00:02:00Z', mesa: 'Mesa 1', seccion: 'Salón principal',
    abrio: 'a.romero', cobrador: 'admin', total: 195, efectivo: 100, qr: 95, recibido: 100, cambio: 0, impresiones: 4,
    autorizaciones: [{numero: 4, autorizadoPor: 'Carlos Mendoza'}],
    envios: [
      {numero: 1, creadoEn: '2026-10-20T23:05:00Z', cajero: 'a.romero', lineas: [
        line(1, 'Combo Brava', {tipo: 'promocion', productos: '1 Doble Brava + 1 Gaseosa 500 ml', sin: 'Doble Brava sin queso cheddar', subtotal: 70}),
        line(2, 'Hamburguesa Clásica', {sin: 'Sin cebolla', subtotal: 70}),
      ]},
      {numero: 2, creadoEn: '2026-10-20T23:31:00Z', cajero: 'admin', lineas: [line(1, 'Hamburguesa Clásica'), line(2, 'Gaseosa 500 ml', {consumo: 'llevar', subtotal: 20})]},
    ],
  },
  {
    id: 42, numero: 42, abiertaEn: '2026-10-20T18:00:00Z', cerradaEn: '2026-10-20T18:40:00Z', mesa: 'Terraza 1', seccion: 'Terraza',
    abrio: 'admin', cobrador: 'admin', total: 58, efectivo: 0, qr: 58, recibido: null, cambio: null, impresiones: 1, autorizaciones: [],
    envios: [{numero: 1, creadoEn: '2026-10-20T18:00:00Z', cajero: 'admin', lineas: [line(1, 'Doble Brava', {subtotal: 58})]}],
  },
];

const EMPLOYEES = [
  {id: 2, nombre: 'Andrea Romero', alias: 'a.romero', activo: true},
  {id: 9, nombre: 'Jorge Quispe', alias: 'j.quispe', activo: false},
];

const employeeName = (id) => {
  if (id === '2') {
    return 'Andrea Romero';
  }
  return 'Todos los empleados';
};

export const createReportsBackend = ({now = Date.now()} = {}) => {
  const calls = {reports: [], pdfs: [], emails: [], schedules: []};
  const control = {emailError: null, mailSimulated: false};
  let schedules = [
    {id: 1, correo: 'gerencia@brasabrava.bo', tipo: 'resumen', dias: '0100100', hora: '08:00', activo: true, ultimoEnvioEn: new Date(now - 60 * MINUTE_MS).toISOString(), ultimoHasta: null, ultimoAtrasado: true, ultimoTurno: new Date(now - 600 * MINUTE_MS).toISOString(), ultimoError: null, proximo: new Date(now + 600 * MINUTE_MS).toISOString()},
  ];
  let nextId = 2;
  const update = (id, changes) => {
    schedules = schedules.map((item) => {
      if (item.id !== id) {
        return item;
      }
      return {...item, ...changes};
    });
    return [200, {programado: schedules.find((item) => item.id === id)}];
  };
  const reportOf = (query) => {
    let ventas = SALES;
    if (query.empleado === '2') {
      ventas = SALES.slice(0, 1);
    }
    const total = ventas.reduce((sum, sale) => sum + sale.total, 0);
    return {
      tipo: query.tipo, desde: query.desde, hasta: query.hasta, periodo: `${query.desde} al ${query.hasta}`,
      empleado: employeeName(query.empleado),
      resumen: {cantidad: ventas.length, total, efectivo: 100, qr: total - 100, promedio: total / Math.max(1, ventas.length)},
      dias: [{fecha: '2026-10-20', ventas: ventas.length, efectivo: 100, qr: total - 100, total}],
      ventas,
    };
  };
  const scheduleRoutes = {};
  for (let id = 1; id <= 5; id += 1) {
    scheduleRoutes[`PUT /reports/schedules/${id}`] = (body) => update(id, body);
    scheduleRoutes[`PATCH /reports/schedules/${id}/status`] = (body) => {
      let proximo = null;
      if (body.activo) {
        proximo = new Date(now + 600 * MINUTE_MS).toISOString();
      }
      return update(id, {activo: body.activo, proximo});
    };
    scheduleRoutes[`DELETE /reports/schedules/${id}`] = () => {
      schedules = schedules.filter((item) => item.id !== id);
      return [204, {}];
    };
    scheduleRoutes[`POST /reports/schedules/${id}/send`] = () => {
      calls.schedules.push({send: id});
      return update(id, {ultimoEnvioEn: new Date(now).toISOString(), ultimoAtrasado: false});
    };
  }
  const handlers = {
    'GET /reports/employees': () => [200, {empleados: EMPLOYEES}],
    'GET /reports/sales': (_body, query) => {
      calls.reports.push(query);
      return [200, {reporte: reportOf(query)}];
    },
    'GET /reports/sales.pdf': (_body, query) => {
      calls.pdfs.push(query);
      return [200, {}, {headers: {'content-disposition': `attachment; filename="brasa-brava-${query.tipo}-${query.desde}-al-${query.hasta}.pdf"`}, blob: new Blob(['%PDF-1.3'])}];
    },
    'POST /reports/sales/email': (body) => {
      calls.emails.push(body);
      if (control.emailError) {
        return [502, {message: control.emailError}];
      }
      return [200, {correo: body.correo, simulado: Boolean(control.mailSimulated)}];
    },
    'GET /reports/schedules': () => [200, {programados: schedules, correoConfigurado: !control.mailSimulated}],
    'POST /reports/schedules': (body) => {
      calls.schedules.push({create: body});
      const programado = {id: nextId, ...body, activo: true, ultimoEnvioEn: null, ultimoHasta: null, ultimoAtrasado: false, ultimoTurno: null, ultimoError: null, proximo: new Date(now + 60 * MINUTE_MS).toISOString()};
      nextId += 1;
      schedules = [...schedules, programado];
      return [201, {programado}];
    },
    ...scheduleRoutes,
  };
  return {handlers, calls, control, sales: SALES};
};
