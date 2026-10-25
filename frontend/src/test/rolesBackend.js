const role = (id, nombre, pantallas, totalEmpleados, extra = {}) => ({id, nombre, pantallas, totalEmpleados, activo: true, ...extra});

export const ROLES = [
  role(1, 'Administrador', ['familia', 'caja', 'administracion', 'productos', 'secciones', 'stock', 'categorias', 'promociones', 'empleados', 'cargos'], 1),
  role(2, 'Cajero', ['familia', 'caja'], 1),
  role(3, 'Mesero', ['familia', 'caja'], 2),
  role(4, 'Delivery', ['caja'], 0, {activo: false}),
];

// Backend falso en memoria para las pruebas de la pantalla de cargos
export const createRolesBackend = () => {
  const store = ROLES.map((item) => ({...item, pantallas: [...item.pantallas]}));
  const calls = {list: [], saved: []};
  const find = (id) => store.find((item) => item.id === id);
  return {
    store,
    calls,
    handlers: {
      'GET /roles': (_body, query) => {
        calls.list.push(query);
        const items = store.filter((item) => query.estado === 'todos' || (query.estado === 'activos') === item.activo);
        return [200, {items, total: items.length, page: Number(query.page), pageSize: Number(query.pageSize), summary: {cargos: 3, inactivos: 1, empleados: 4}}];
      },
      'POST /roles': (body) => {
        calls.saved.push(body);
        if (store.some((item) => item.nombre.toLowerCase() === body.nombre.toLowerCase())) {
          return [409, {message: 'Ya existe un cargo con ese nombre'}];
        }
        const created = role(9, body.nombre, body.pantallas, 0);
        store.push(created);
        return [201, {role: created}];
      },
      'PUT /roles/3': (body) => {
        calls.saved.push(body);
        Object.assign(find(3), body);
        return [200, {role: find(3)}];
      },
      'PATCH /roles/3/status': () => [409, {message: 'No se puede dar de baja: 2 empleados activos tienen este cargo. Cámbieles el cargo primero'}],
      'PATCH /roles/4/status': (body) => {
        find(4).activo = body.activo;
        return [200, {role: find(4)}];
      },
    },
  };
};
