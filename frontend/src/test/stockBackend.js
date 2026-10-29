const levelOf = (stockActual, stockMinimo) => {
  let nivel = 'suficiente';
  if (stockActual === 0) {
    nivel = 'sin_stock';
  }
  else if (stockActual <= stockMinimo) {
    nivel = 'bajo';
  }
  return nivel;
};

const ingredient = (id, nombre, unidad, stockActual, stockMinimo, extra = {}) => ({id, nombre, unidad, stockActual, stockMinimo, nivel: levelOf(stockActual, stockMinimo), activo: true, ...extra});

const INGREDIENTS = [
  ingredient(1, 'Carne de res', 'kg', 12, 5, {unidadFija: true}),
  ingredient(2, 'Queso cheddar', 'kg', 1.5, 2),
  ingredient(3, 'Lechuga', 'unidad', 0, 5),
  ingredient(4, 'Aceite', 'l', 6, 4, {activo: false}),
];

export const createStockBackend = () => {
  const store = INGREDIENTS.map((item) => ({...item}));
  const calls = {list: [], saved: []};
  const find = (id) => store.find((item) => item.id === id);
  const handlers = {
    'GET /ingredients': (_body, query) => {
      calls.list.push(query);
      return [200, {items: store, total: store.length, page: Number(query.page), pageSize: Number(query.pageSize)}];
    },
    'POST /ingredients': (body) => {
      calls.saved.push(body);
      const created = ingredient(9, body.nombre, body.unidad, body.stockInicial ?? 0, body.stockMinimo);
      store.push(created);
      return [201, {ingredient: created}];
    },
    'PUT /ingredients/1': (body) => {
      calls.saved.push(body);
      if (body.nombre === 'Lechuga') {
        return [409, {message: 'Ya existe un insumo con ese nombre'}];
      }
      const item = Object.assign(find(1), body);
      item.nivel = levelOf(item.stockActual, item.stockMinimo);
      return [200, {ingredient: item}];
    },
    'PATCH /ingredients/1/status': (body) => {
      find(1).activo = body.activo;
      return [200, {ingredient: find(1)}];
    },
  };
  return {store, calls, handlers};
};
