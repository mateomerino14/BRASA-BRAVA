const MINUTE_MS = 60000;

const ingredient = (id, nombre) => ({id, nombre});

export const CATALOG = {
  hoy: '2026-10-13',
  categorias: [{id: 1, nombre: 'Hamburguesas'}, {id: 2, nombre: 'Bebidas y Refrescos'}],
  productos: [
    {id: 11, nombre: 'Hamburguesa Clásica', descripcion: 'Carne, queso, lechuga y tomate', precio: 35, imagenUrl: null, disponible: true, porciones: 12, idCategoria: 1, categoria: 'Hamburguesas', ingredientes: [ingredient(5, 'Lechuga'), ingredient(4, 'Tomate')]},
    {id: 12, nombre: 'Doble Brava', descripcion: 'Dos carnes', precio: 58, imagenUrl: null, disponible: true, porciones: 3, idCategoria: 1, categoria: 'Hamburguesas', ingredientes: [ingredient(3, 'Queso cheddar')]},
    {id: 13, nombre: 'Gaseosa 500 ml', descripcion: 'Sabores surtidos', precio: 10, imagenUrl: null, disponible: true, porciones: 0, idCategoria: 2, categoria: 'Bebidas y Refrescos', ingredientes: []},
    {id: 14, nombre: 'Cerveza Artesanal', descripcion: 'Rubia de la casa', precio: 25, imagenUrl: null, disponible: false, porciones: 0, idCategoria: 2, categoria: 'Bebidas y Refrescos', ingredientes: []},
  ],
  promociones: [
    {
      id: 2, nombre: 'Combo Brava', descripcion: null, tipo: 'combo', valor: 70, imagenUrl: null, precio: 70, precioRegular: 83, ahorro: 13,
      productos: [
        {idProducto: 12, nombre: 'Doble Brava', cantidad: 1, ingredientes: [ingredient(3, 'Queso cheddar')]},
        {idProducto: 13, nombre: 'Gaseosa 500 ml', cantidad: 1, ingredientes: []},
      ],
    },
  ],
};

const WAITERS = [
  {id: 1, nombre: 'Carlos Mendoza', cargo: 'Mesero'},
  {id: 2, nombre: 'Andrea Romero', cargo: 'Cajero'},
];

const TABLES = [
  {id: 1, nombre: 'Mesa 1', capacidad: 4, seccion: {id: 1, nombre: 'Salón principal'}},
  {id: 2, nombre: 'Mesa 2', capacidad: 4, seccion: {id: 1, nombre: 'Salón principal'}},
  {id: 20, nombre: 'Terraza 1', capacidad: 6, seccion: {id: 2, nombre: 'Terraza'}},
];

// Productos de un combo, como los manda la API en las líneas de promoción
const comboProducts = (line) => {
  if (line.tipo !== 'promocion') {
    return [];
  }
  return CATALOG.promociones.find((entry) => entry.id === (line.idPromocion ?? line.id)).productos.map((item) => ({nombre: item.nombre, cantidad: item.cantidad}));
};

const detail = (id, envio, line, mesero, creadoEn) => ({
  productos: comboProducts(line),
  listos: line.listos ?? 0,
  id, envio, tipo: line.tipo, idProducto: line.idProducto ?? null, idPromocion: line.idPromocion ?? null,
  nombre: line.nombre, precioUnitario: line.precio, cantidad: line.cantidad, subtotal: line.precio * line.cantidad,
  consumo: line.consumo, mesero, creadoEn, exclusiones: line.exclusiones ?? [],
});

const waiterOf = (id) => {
  const found = WAITERS.find((item) => item.id === id);
  return {id: found.id, nombre: found.nombre};
};

// Busca un producto o una promoción del catálogo para armar una línea con nombre y precio
const lineFrom = (item) => {
  if (item.tipo === 'promocion') {
    const promo = CATALOG.promociones.find((entry) => entry.id === item.id);
    const names = new Map(promo.productos.flatMap((product) => product.ingredientes.map((ing) => [`${product.idProducto}:${ing.id}`, [product.nombre, ing.nombre]])));
    return {...item, idPromocion: item.id, nombre: promo.nombre, precio: promo.precio, exclusiones: item.exclusiones.map((x) => {
      const [producto, insumo] = names.get(`${x.idProducto}:${x.idInsumo}`);
      return {...x, producto, insumo};
    })};
  }
  const product = CATALOG.productos.find((entry) => entry.id === item.id);
  return {...item, idProducto: item.id, nombre: product.nombre, precio: product.precio, exclusiones: item.exclusiones.map((x) => ({
    ...x, producto: product.nombre, insumo: product.ingredientes.find((ing) => ing.id === x.idInsumo).nombre,
  }))};
};

// Backend falso en memoria para las pruebas de Caja: Mesa 2 ya tiene el pedido Nº 7 abierto
export const createCashierBackend = ({now = Date.now()} = {}) => {
  const openedAt = new Date(now - 25 * MINUTE_MS).toISOString();
  const sales = {
    2: {
      id: 7, numero: 7, total: 105, envios: 1, abiertaEn: openedAt, cajero: 'a.romero', mesero: waiterOf(1),
      modificado: false, modificadoPor: null, comandas: [{envio: 1, cajero: 'a.romero', mesero: waiterOf(1), creadoEn: openedAt}],
      detalles: [
        detail(1, 1, {tipo: 'producto', idProducto: 11, nombre: 'Hamburguesa Clásica', precio: 35, cantidad: 1, listos: 1, consumo: 'local', exclusiones: [{idProducto: 11, producto: 'Hamburguesa Clásica', idInsumo: 4, insumo: 'Tomate'}]}, waiterOf(1), openedAt),
        detail(2, 1, {tipo: 'promocion', idPromocion: 2, nombre: 'Combo Brava', precio: 70, cantidad: 1, consumo: 'local'}, waiterOf(1), openedAt),
      ],
    },
  };
  const calls = {orders: []};
  const control = {orderError: null, shortages: []};
  let nextSale = 8;
  let nextDetail = 100;

  const floor = () => {
    const sections = [];
    for (const table of TABLES) {
      let section = sections.find((item) => item.id === table.seccion.id);
      if (!section) {
        section = {id: table.seccion.id, nombre: table.seccion.nombre, mesas: []};
        sections.push(section);
      }
      const sale = sales[table.id];
      let venta = null;
      if (sale) {
        venta = {id: sale.id, total: sale.total, unidades: sale.detalles.reduce((total, item) => total + item.cantidad, 0), listos: sale.detalles.reduce((total, item) => total + item.listos, 0), mesero: sale.mesero.nombre, abiertaEn: sale.abiertaEn};
      }
      section.mesas.push({id: table.id, nombre: table.nombre, capacidad: table.capacidad, venta});
    }
    const busy = Object.values(sales);
    return {secciones: sections, summary: {mesas: TABLES.length, ocupadas: busy.length, libres: TABLES.length - busy.length, porCobrar: busy.reduce((total, sale) => total + sale.total, 0)}};
  };

  const handlers = {
    'GET /sales/floor': () => [200, floor()],
    'GET /sales/catalog': () => [200, CATALOG],
    'GET /sales/waiters': () => [200, {meseros: WAITERS}],
  };
  for (const table of TABLES) {
    handlers[`GET /sales/tables/${table.id}`] = () => [200, {mesa: table, venta: sales[table.id] ?? null}];
    handlers[`POST /sales/tables/${table.id}/orders`] = (body) => {
      calls.orders.push({idMesa: table.id, body});
      if (control.orderError) {
        return [400, {message: control.orderError}];
      }
      const created = !sales[table.id];
      const stamp = new Date(now).toISOString();
      if (created) {
        sales[table.id] = {id: nextSale, numero: nextSale, total: 0, envios: 0, abiertaEn: stamp, cajero: 'admin', mesero: waiterOf(body.idMesero), modificado: false, modificadoPor: null, comandas: [], detalles: []};
        nextSale += 1;
      }
      const sale = sales[table.id];
      sale.envios += 1;
      sale.comandas.push({envio: sale.envios, cajero: 'admin', mesero: waiterOf(body.idMesero), creadoEn: stamp});
      if (sale.envios > 1) {
        sale.modificado = true;
        sale.modificadoPor = 'admin';
      }
      for (const item of body.items) {
        nextDetail += 1;
        const line = lineFrom(item);
        sale.detalles.push(detail(nextDetail, sale.envios, line, waiterOf(body.idMesero), stamp));
        sale.total += line.precio * line.cantidad;
      }
      return [201, {mesa: table, venta: structuredClone(sale), nueva: created, envio: sale.envios, sinStock: control.shortages}];
    };
  }
  return {handlers, calls, control, sales};
};
