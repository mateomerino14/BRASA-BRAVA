const tables = (prefix, count, capacidad, firstId) => Array.from({length: count}, (_, index) => ({id: firstId + index, nombre: `${prefix} ${index + 1}`, capacidad}));

const section = (id, nombre, mesas, extra = {}) => ({
  id, nombre, descripcion: null, activa: true, mesas,
  totalMesas: mesas.length, capacidad: mesas.reduce((total, table) => total + table.capacidad, 0), ...extra,
});

export const SECTIONS = [
  section(1, 'Salón principal', tables('Mesa', 6, 4, 1), {descripcion: 'Junto a la parrilla'}),
  section(2, 'Terraza', tables('Terraza', 2, 4, 20)),
  section(3, 'Salón VIP', tables('VIP', 1, 8, 30), {activa: false}),
];

// Backend falso en memoria para las pruebas de la pantalla de secciones
export const createSectionsBackend = () => {
  const store = SECTIONS.map((item) => ({...item, mesas: [...item.mesas]}));
  const calls = {list: [], saved: []};
  let nextId = 100;
  const withIds = (mesas) => mesas.map((table) => {
    if (table.id) {
      return table;
    }
    nextId += 1;
    return {...table, id: nextId};
  });
  const totals = (mesas) => ({totalMesas: mesas.length, capacidad: mesas.reduce((total, table) => total + table.capacidad, 0)});
  const find = (id) => store.find((item) => item.id === id);
  return {
    store,
    calls,
    handlers: {
      'GET /sections': (_body, query) => {
        calls.list.push(query);
        const items = store.filter((item) => query.estado === 'todos' || (query.estado === 'activos') === item.activa);
        return [200, {items, total: items.length, page: Number(query.page), pageSize: Number(query.pageSize), summary: {secciones: 2, mesas: 8, capacidad: 32}}];
      },
      'POST /sections': (body) => {
        calls.saved.push(body);
        if (store.some((item) => item.nombre.toLowerCase() === body.nombre.toLowerCase())) {
          return [409, {message: 'Ya existe una sección con ese nombre'}];
        }
        const mesas = withIds(body.mesas);
        const created = {...body, id: 9, activa: true, descripcion: body.descripcion || null, mesas, ...totals(mesas)};
        store.push(created);
        return [201, {section: created}];
      },
      'PUT /sections/2': (body) => {
        calls.saved.push(body);
        const mesas = withIds(body.mesas);
        Object.assign(find(2), body, {mesas, ...totals(mesas)});
        return [200, {section: find(2)}];
      },
      'PATCH /sections/1/status': (body) => {
        find(1).activa = body.activo;
        return [200, {section: find(1)}];
      },
    },
  };
};
