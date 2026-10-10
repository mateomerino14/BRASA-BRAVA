const ingredient = (id, nombre, unidad, stockActual, stockMinimo, extra = {}) => {
  let nivel = 'suficiente';
  if (stockActual === 0) {
    nivel = 'sin_stock';
  }
  else if (stockActual <= stockMinimo) {
    nivel = 'bajo';
  }
  return {id, nombre, unidad, stockActual, stockMinimo, nivel, activo: true, ...extra};
};

export const INGREDIENTS = [
  ingredient(1, 'Carne de res', 'kg', 12, 5),
  ingredient(2, 'Queso cheddar', 'kg', 1.5, 2),
  ingredient(3, 'Lechuga', 'unidad', 0, 5),
  ingredient(4, 'Aceite', 'l', 6, 4, {activo: false}),
];

// Backend falso en memoria para las pruebas de la pantalla de stock
export const createStockBackend = () => {
  const store = INGREDIENTS.map((item) => ({...item}));
  const calls = {list: [], saved: [], movements: [], history: []};
  const find = (id) => store.find((item) => item.id === id);
  const handlers = {
    'GET /ingredients': (_body, query) => {
      calls.list.push(query);
      const items = store.filter((item) => query.nivel === 'todos' || item.nivel === query.nivel);
      return [200, {items, total: items.length, page: Number(query.page), pageSize: Number(query.pageSize), summary: {total: 3, bajo: 1, sinStock: 1}}];
    },
    'POST /ingredients': (body) => {
      calls.saved.push(body);
      const created = ingredient(9, body.nombre, body.unidad, body.stockInicial ?? 0, body.stockMinimo);
      store.push(created);
      return [201, {ingredient: created}];
    },
    'PUT /ingredients/1': (body) => {
      calls.saved.push(body);
      if (body.unidad !== 'kg') {
        return [409, {message: 'No se puede cambiar la unidad de un insumo que ya tiene movimientos'}];
      }
      Object.assign(find(1), body);
      return [200, {ingredient: find(1)}];
    },
    'POST /ingredients/1/movements': (body) => {
      calls.movements.push(body);
      const item = find(1);
      if (body.tipo === 'entrada') {
        item.stockActual += body.cantidad;
      }
      if (body.tipo === 'salida') {
        item.stockActual -= body.cantidad;
      }
      if (body.tipo === 'ajuste') {
        item.stockActual = body.cantidad;
      }
      return [201, {ingredient: item}];
    },
    'GET /ingredients/1/movements': (_body, query) => {
      calls.history.push(query);
      const all = [
        {id: 2, tipo: 'salida', cantidad: -0.5, stockResultante: 12, motivo: 'Merma', responsable: 'admin', fecha: '2026-10-10T12:00:00Z'},
        {id: 1, tipo: 'entrada', cantidad: 12.5, stockResultante: 12.5, motivo: null, responsable: 'DIRECTORIO', fecha: '2026-10-09T12:00:00Z'},
      ];
      return [200, {items: all, total: all.length, page: Number(query.page), pageSize: Number(query.pageSize)}];
    },
    'PATCH /ingredients/1/status': (body) => {
      find(1).activo = body.activo;
      return [200, {ingredient: find(1)}];
    },
  };
  return {store, calls, handlers};
};
