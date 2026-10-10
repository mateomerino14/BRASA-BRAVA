const product = (id, nombre, extra = {}) => ({
  id, nombre, descripcion: null, precio: 35, imagenUrl: null, disponible: true, porciones: 20,
  idCategoria: 1, categoria: 'Hamburguesas', idSubcategoria: 11, subcategoria: 'Clásicas', ...extra,
});

export const FAMILY_CATALOG = {
  hoy: '2026-10-13',
  categorias: [
    {id: 1, nombre: 'Hamburguesas', subcategorias: [{id: 11, nombre: 'Clásicas'}, {id: 12, nombre: 'Doble Carne'}]},
    {id: 2, nombre: 'Bebidas y Refrescos', subcategorias: [{id: 21, nombre: 'Gaseosas'}, {id: 22, nombre: 'Cervezas'}]},
  ],
  productos: [
    product(1, 'Hamburguesa Clásica', {descripcion: 'Carne, queso, lechuga y tomate', porciones: 0}),
    product(2, 'Doble Brava', {precio: 58, porciones: 3, idSubcategoria: 12, subcategoria: 'Doble Carne'}),
    product(3, 'Gaseosa 500 ml', {precio: 10, porciones: null, idCategoria: 2, categoria: 'Bebidas y Refrescos', idSubcategoria: 21, subcategoria: 'Gaseosas'}),
    product(4, 'Cerveza Artesanal', {precio: 25, disponible: false, idCategoria: 2, categoria: 'Bebidas y Refrescos', idSubcategoria: 22, subcategoria: 'Cervezas'}),
  ],
  promociones: [
    {
      id: 2, nombre: 'Combo Brava', descripcion: 'Para compartir', tipo: 'combo', valor: 70, imagenUrl: null, dias: '1111111', fechaInicio: '2026-10-06', fechaFin: '2026-11-12',
      vigencia: 'vigente', disponible: true, precio: 70, precioRegular: 83, ahorro: 13,
      productos: [{id: 2, nombre: 'Doble Brava', cantidad: 1, precio: 58}, {id: 3, nombre: 'Gaseosa 500 ml', cantidad: 1, precio: 10}],
    },
    {
      id: 3, nombre: 'Happy Hour Cervecero', descripcion: null, tipo: 'descuento', valor: 15, imagenUrl: null, dias: '0111110', fechaInicio: '2026-10-18', fechaFin: null,
      vigencia: 'programada', disponible: false, precio: 21.25, precioRegular: 25, ahorro: 3.75,
      productos: [{id: 4, nombre: 'Cerveza Artesanal', cantidad: 1, precio: 25}],
    },
  ],
};

const RECIPE = [
  {id: 1, nombre: 'Carne de res', unidad: 'kg', cantidad: 0.15, stock: 12, activo: true, nivel: 'suficiente', alcanza: 80},
  {id: 5, nombre: 'Lechuga', unidad: 'unidad', cantidad: 1, stock: 0, activo: true, nivel: 'sin_stock', alcanza: 0},
];

// Backend falso para la pantalla de Familia
export const createFamilyBackend = () => {
  const calls = [];
  const handlers = {'GET /catalog': () => [200, FAMILY_CATALOG]};
  for (const item of FAMILY_CATALOG.productos) {
    handlers[`GET /catalog/products/${item.id}`] = () => {
      calls.push(item.id);
      return [200, {producto: {...item, receta: item.id === 1 ? RECIPE : []}}];
    };
  }
  return {handlers, calls};
};
