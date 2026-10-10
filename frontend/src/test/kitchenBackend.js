const MINUTE_MS = 60000;

const line = (id, nombre, cantidad, listos, extra = {}) => ({id, tipo: 'producto', nombre, cantidad, listos, consumo: 'local', productos: [], exclusiones: [], ...extra});

// Backend falso en memoria para la pantalla de cocina: Terraza 1 espera hace 25 min y Mesa 2 (envío 2) hace 5 min
export const createKitchenBackend = ({now = Date.now()} = {}) => {
  const shipments = [
    {
      id: '2-1', idVenta: 2, numero: 2, envio: 1, modificadoPor: null, mesa: 'Terraza 1', seccion: 'Terraza', mesero: 'Carlos Mendoza',
      creadoEn: new Date(now - 25 * MINUTE_MS).toISOString(),
      lineas: [
        line(21, 'Doble Brava', 1, 0, {exclusiones: [{producto: 'Doble Brava', insumo: 'Queso cheddar'}]}),
        line(22, 'Papas Fritas Clásicas', 2, 1, {consumo: 'llevar'}),
      ],
    },
    {
      id: '1-2', idVenta: 1, numero: 1, envio: 2, modificadoPor: 'a.romero', mesa: 'Mesa 2', seccion: 'Salón principal', mesero: 'Marco Vargas',
      creadoEn: new Date(now - 5 * MINUTE_MS).toISOString(),
      lineas: [
        line(11, 'Combo Brava', 1, 0, {tipo: 'promocion', productos: [{nombre: 'Doble Brava', cantidad: 1}, {nombre: 'Gaseosa 500 ml', cantidad: 1}]}),
      ],
    },
  ];
  const calls = [];
  const control = {error: null};

  const snapshot = () => {
    const envios = shipments.map((item) => {
      const unidades = item.lineas.reduce((total, row) => total + row.cantidad, 0);
      const listas = item.lineas.reduce((total, row) => total + row.listos, 0);
      return structuredClone({...item, unidades, listas, estado: listas === unidades ? 'listo' : 'preparacion'});
    });
    const pending = envios.filter((item) => item.estado === 'preparacion');
    const ready = envios.filter((item) => item.estado === 'listo');
    return {envios: [...pending, ...ready], summary: {preparacion: pending.length, listos: ready.length, unidadesPendientes: pending.reduce((total, item) => total + item.unidades - item.listas, 0)}};
  };

  const apply = (row, accion) => {
    const next = {sumar: Math.min(row.cantidad, row.listos + 1), restar: Math.max(0, row.listos - 1), todos: row.cantidad, ninguno: 0};
    row.listos = next[accion];
  };

  const handlers = {'GET /kitchen/orders': () => [200, snapshot()]};
  for (const shipment of shipments) {
    handlers[`PATCH /kitchen/shipments/${shipment.idVenta}/${shipment.envio}`] = (body) => {
      calls.push({shipment: shipment.id, ...body});
      shipment.lineas.forEach((row) => apply(row, body.accion));
      return [200, snapshot()];
    };
    for (const row of shipment.lineas) {
      handlers[`PATCH /kitchen/lines/${row.id}`] = (body) => {
        calls.push({line: row.id, ...body});
        if (control.error) {
          return [404, {message: control.error}];
        }
        apply(row, body.accion);
        return [200, snapshot()];
      };
    }
  }
  return {handlers, calls, control};
};
