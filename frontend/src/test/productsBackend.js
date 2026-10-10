export const PRODUCT_OPTIONS = [
  {id: 1, nombre: 'Hamburguesas', subcategorias: [{id: 1, nombre: 'Clásicas'}, {id: 2, nombre: 'Especiales'}]},
  {id: 2, nombre: 'Bebidas y Refrescos', subcategorias: [{id: 6, nombre: 'Gaseosas'}]},
];

const product = (id, nombre, precio, categoria, subcategoria, extra = {}) => ({
  id, nombre, descripcion: null, precio, imagenUrl: null, activo: true, disponible: true,
  categoria: {activa: true, ...categoria}, subcategoria: {activa: true, ...subcategoria}, ...extra,
});

export const PRODUCTS = [
  product(1, 'Hamburguesa Clásica', 35, {id: 1, nombre: 'Hamburguesas'}, {id: 1, nombre: 'Clásicas'}, {descripcion: 'Carne, queso y tomate', imagenUrl: '/uploads/clasica.png'}),
  product(2, 'Gaseosa 500 ml', 10, {id: 2, nombre: 'Bebidas y Refrescos'}, {id: 6, nombre: 'Gaseosas'}, {disponible: false}),
  product(3, 'Dúo Parrillero', 85, {id: 4, nombre: 'Combos Especiales', activa: false}, {id: 10, nombre: 'Dúo Parrillero'}),
  product(4, 'Hamburguesa Hawaiana', 45, {id: 1, nombre: 'Hamburguesas'}, {id: 2, nombre: 'Especiales'}, {activo: false}),
];

const findSub = (idSubcategoria) => {
  for (const category of PRODUCT_OPTIONS) {
    const sub = category.subcategorias.find((item) => item.id === idSubcategoria);
    if (sub) {
      return {categoria: {id: category.id, nombre: category.nombre, activa: true}, subcategoria: {...sub, activa: true}};
    }
  }
  return null;
};

// Backend falso en memoria para las pruebas de la pantalla de productos
export const createProductsBackend = ({failAvailability = false} = {}) => {
  const store = PRODUCTS.map((item) => ({...item}));
  const calls = {list: [], saved: [], uploads: [], availability: []};
  const find = (id) => store.find((item) => item.id === id);
  const matches = (item, query) => {
    if (query.search && !item.nombre.toLowerCase().includes(query.search.toLowerCase())) {
      return false;
    }
    if (query.idCategoria && item.categoria.id !== Number(query.idCategoria)) {
      return false;
    }
    if (query.idSubcategoria && item.subcategoria.id !== Number(query.idSubcategoria)) {
      return false;
    }
    if (query.disponibilidad === 'agotados' && item.disponible) {
      return false;
    }
    return true;
  };
  const handlers = {
    'GET /products/options': () => [200, {categorias: PRODUCT_OPTIONS}],
    'GET /products': (_body, query) => {
      calls.list.push(query);
      const items = store.filter((item) => matches(item, query));
      return [200, {items, total: items.length, page: Number(query.page), pageSize: Number(query.pageSize)}];
    },
    'POST /products': (body) => {
      calls.saved.push(body);
      if (store.some((item) => item.nombre.toLowerCase() === body.nombre.toLowerCase())) {
        return [409, {message: 'Ya existe un producto con ese nombre'}];
      }
      const created = {...body, id: 99, imagenUrl: null, activo: true, disponible: true, descripcion: body.descripcion || null, ...findSub(body.idSubcategoria)};
      store.push(created);
      return [201, {product: created}];
    },
    'PUT /products/3': (body) => {
      calls.saved.push(body);
      const updated = Object.assign(find(3), {...body, descripcion: body.descripcion || null});
      return [200, {product: updated}];
    },
    'PATCH /products/1/status': (body) => {
      find(1).activo = body.activo;
      return [200, {product: find(1)}];
    },
    'PUT /products/99/image': (body) => {
      calls.uploads.push(body.get('imagen'));
      find(99).imagenUrl = '/uploads/99.png';
      return [200, {product: find(99)}];
    },
  };
  for (const id of [1, 2]) {
    handlers[`PATCH /products/${id}/availability`] = (body) => {
      calls.availability.push({id, ...body});
      if (failAvailability) {
        return [500, {message: 'No se pudo cambiar la disponibilidad'}];
      }
      find(id).disponible = body.disponible;
      return [200, {product: find(id)}];
    };
  }
  return {store, calls, handlers};
};
