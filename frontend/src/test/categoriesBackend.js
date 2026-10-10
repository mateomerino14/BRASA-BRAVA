export const CATEGORIES = [
  {id: 1, nombre: 'Hamburguesas', descripcion: 'A la parrilla', imagenUrl: '/uploads/burger.png', activa: true, totalProductos: 0, subcategorias: [{id: 1, nombre: 'Clásicas'}, {id: 2, nombre: 'Especiales'}, {id: 3, nombre: 'Doble Carne'}, {id: 4, nombre: 'Veggie'}, {id: 5, nombre: 'Picantes'}]},
  {id: 2, nombre: 'Bebidas y Refrescos', descripcion: null, imagenUrl: null, activa: true, totalProductos: 0, subcategorias: [{id: 6, nombre: 'Gaseosas'}, {id: 7, nombre: 'Cervezas'}]},
  {id: 4, nombre: 'Combos Especiales', descripcion: null, imagenUrl: null, activa: false, totalProductos: 0, subcategorias: [{id: 10, nombre: 'Dúo Parrillero'}]},
];

// Backend falso en memoria para las pruebas de la pantalla de categorías
export const createCategoriesBackend = ({failUpload = false} = {}) => {
  const store = CATEGORIES.map((category) => ({...category, subcategorias: [...category.subcategorias]}));
  const calls = {list: [], saved: [], uploads: [], removed: []};
  let nextId = 50;
  const matches = (category, query) => {
    const text = `${category.nombre} ${category.subcategorias.map((sub) => sub.nombre).join(' ')}`.toLowerCase();
    if (query.search && !text.includes(query.search.toLowerCase())) {
      return false;
    }
    if (query.estado === 'activos' && !category.activa) {
      return false;
    }
    if (query.estado === 'inactivos' && category.activa) {
      return false;
    }
    return true;
  };
  const withIds = (subcategorias) => subcategorias.map((sub) => {
    if (sub.id) {
      return sub;
    }
    nextId += 1;
    return {...sub, id: nextId};
  });
  const find = (id) => store.find((category) => category.id === id);
  const handlers = {
    'GET /categories': (_body, query) => {
      calls.list.push(query);
      const items = store.filter((category) => matches(category, query));
      return [200, {items, total: items.length, page: Number(query.page), pageSize: Number(query.pageSize)}];
    },
    'POST /categories': (body) => {
      calls.saved.push(body);
      if (store.some((category) => category.nombre.toLowerCase() === body.nombre.toLowerCase())) {
        return [409, {message: 'Ya existe una categoría con ese nombre'}];
      }
      const category = {...body, id: 99, descripcion: body.descripcion || null, imagenUrl: null, activa: true, totalProductos: 0, subcategorias: withIds(body.subcategorias)};
      store.push(category);
      return [201, {category}];
    },
    'PUT /categories/1': (body) => {
      calls.saved.push(body);
      const category = Object.assign(find(1), body, {subcategorias: withIds(body.subcategorias)});
      return [200, {category}];
    },
    'PATCH /categories/1/status': (body) => {
      const category = find(1);
      category.activa = body.activo;
      return [200, {category}];
    },
    'DELETE /categories/1/image': () => {
      calls.removed.push(1);
      const category = find(1);
      category.imagenUrl = null;
      return [200, {category}];
    },
  };
  for (const id of [1, 99]) {
    handlers[`PUT /categories/${id}/image`] = (body) => {
      if (failUpload) {
        return [400, {message: 'La imagen debe ser PNG, JPG o WEBP'}];
      }
      calls.uploads.push({id, file: body.get('imagen')});
      const category = find(id);
      category.imagenUrl = `/uploads/${id}.png`;
      return [200, {category}];
    };
  }
  return {store, calls, handlers};
};
