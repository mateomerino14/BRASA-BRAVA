export const PRODUCT_OPTIONS = [
  {id: 1, nombre: 'Doble Brava', precio: 58, categoria: 'Hamburguesas'},
  {id: 2, nombre: 'Papas Fritas Clásicas', precio: 15, categoria: 'Guarniciones'},
  {id: 3, nombre: 'Gaseosa 500 ml', precio: 10, categoria: 'Bebidas'},
];

const item = (idProducto, nombre, precio, cantidad = 1, activo = true) => ({idProducto, nombre, precio, cantidad, activo});

export const PROMOTIONS = [
  {
    id: 1, nombre: 'Combo Brava', descripcion: null, tipo: 'combo', valor: 70, fechaInicio: '2026-10-03', fechaFin: '2026-11-09', dias: '1111111', imagenUrl: null, activa: true, vigencia: 'vigente',
    productos: [item(1, 'Doble Brava', 58), item(2, 'Papas Fritas Clásicas', 15), item(3, 'Gaseosa 500 ml', 10)], precioRegular: 83, precioPromocion: 70, ahorro: 13,
  },
  {
    id: 2, nombre: 'Martes de Hamburguesas', descripcion: null, tipo: 'descuento', valor: 20, fechaInicio: '2026-09-10', fechaFin: null, dias: '0010000', imagenUrl: null, activa: true, vigencia: 'otro_dia',
    productos: [item(9, 'Hamburguesa Hawaiana', 45, 1, false)], precioRegular: 45, precioPromocion: 36, ahorro: 9,
  },
];

// Backend falso en memoria para las pruebas de la pantalla de promociones
export const createPromotionsBackend = () => {
  const store = PROMOTIONS.map((promotion) => ({...promotion}));
  const calls = {list: [], saved: []};
  return {
    store,
    calls,
    handlers: {
      'GET /promotions/product-options': () => [200, {productos: PRODUCT_OPTIONS}],
      'GET /promotions': (_body, query) => {
        calls.list.push(query);
        return [200, {items: store, total: store.length, page: Number(query.page), pageSize: Number(query.pageSize), summary: {vigentes: 1, programadas: 0, vencidas: 0}, hoy: '2026-10-10'}];
      },
      'POST /promotions': (body) => {
        calls.saved.push(body);
        const created = {...body, id: 9, activa: true, vigencia: 'vigente', imagenUrl: null, productos: [], precioRegular: 0, precioPromocion: body.valor, ahorro: 0};
        store.push(created);
        return [201, {promotion: created}];
      },
      'PUT /promotions/2': (body) => {
        calls.saved.push(body);
        Object.assign(store[1], body);
        return [200, {promotion: store[1]}];
      },
      'PATCH /promotions/1/status': (body) => {
        store[0].activa = body.activo;
        return [200, {promotion: store[0]}];
      },
    },
  };
};
