// Backend falso de la eliminación física: un empleado y una sección de baja, y dos ventas cobradas
export const createDeletionBackend = () => {
  const calls = {previews: [], executes: [], candidates: []};
  const data = {
    empleados: [{id: 9, nombre: 'Jorge Quispe', alias: 'j.quispe', cargo: 'Mesero', ventas: 2}],
    cargos: [],
    secciones: [{id: 4, nombre: 'Patio', mesas: 3, ventas: 0}],
    productos: [],
    categorias: [],
    insumos: [],
    promociones: [],
    ventas: [
      {id: 31, cerradaEn: '2026-10-20T23:00:00Z', total: 120, mesa: 'Mesa 3', seccion: 'Salón principal', cobrador: 'a.romero'},
      {id: 32, cerradaEn: '2026-10-21T01:00:00Z', total: 86, mesa: 'Terraza 1', seccion: 'Terraza', cobrador: 'admin'},
    ],
  };
  const control = {bloqueos: []};
  const handlers = {
    'POST /deletion/preview': (body) => {
      calls.previews.push(body);
      return [200, {
        elegidos: {empleados: body.empleados.map(() => 'Jorge Quispe'), cargos: [], secciones: body.secciones.map(() => 'Patio'), productos: [], categorias: [], insumos: [], promociones: [], ventas: body.ventas.length},
        arrastra: {empleados: [], mesas: body.secciones.map(() => ['Patio 1', 'Patio 2', 'Patio 3']).flat(), productos: [], promociones: [], ventas: {total: body.empleados.length * 2, ejemplos: body.empleados.map(() => ({id: 30, mesa: 'Mesa 1', total: 35, cerradaEn: '2026-10-19T20:00:00Z'}))}},
        bloqueos: control.bloqueos,
      }];
    },
    'POST /deletion/execute': (body) => {
      calls.executes.push(body);
      data.empleados = data.empleados.filter((row) => !body.empleados.includes(row.id));
      data.secciones = data.secciones.filter((row) => !body.secciones.includes(row.id));
      return [200, {borrados: {empleados: body.empleados.length, cargos: 0, secciones: body.secciones.length, mesas: body.secciones.length * 3, productos: 0, categorias: 0, insumos: 0, promociones: 0, ventas: body.empleados.length * 2}}];
    },
  };
  for (const tipo of Object.keys(data)) {
    handlers[`GET /deletion/candidates/${tipo}`] = (_body, query) => {
      calls.candidates.push({tipo, ...query});
      return [200, {registros: data[tipo]}];
    };
  }
  return {handlers, calls, control};
};
