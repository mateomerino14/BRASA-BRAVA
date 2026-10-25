const MINUTE_MS = 60000;
const MAX_TEST_SALE = 20;

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

const detail = (id, envio, line, cajero, creadoEn) => ({
  productos: comboProducts(line),
  listos: line.listos ?? 0,
  id, envio, tipo: line.tipo, idProducto: line.idProducto ?? null, idPromocion: line.idPromocion ?? null,
  nombre: line.nombre, precioUnitario: line.precio, cantidad: line.cantidad, subtotal: line.precio * line.cantidad,
  consumo: line.consumo, cajero, creadoEn, exclusiones: line.exclusiones ?? [],
});

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
      id: 7, numero: 7, total: 105, envios: 1, abiertaEn: openedAt, cajero: 'a.romero',
      modificado: false, modificadoPor: null, comandas: [{envio: 1, cajero: 'a.romero', creadoEn: openedAt}],
      detalles: [
        detail(1, 1, {tipo: 'producto', idProducto: 11, nombre: 'Hamburguesa Clásica', precio: 35, cantidad: 1, listos: 1, consumo: 'local', exclusiones: [{idProducto: 11, producto: 'Hamburguesa Clásica', idInsumo: 4, insumo: 'Tomate'}]}, 'a.romero', openedAt),
        detail(2, 1, {tipo: 'promocion', idPromocion: 2, nombre: 'Combo Brava', precio: 70, cantidad: 1, consumo: 'local'}, 'a.romero', openedAt),
      ],
    },
  };
  const calls = {orders: [], checkouts: [], settings: [], marks: [], prints: []};
  const control = {orderError: null, shortages: [], checkoutError: null};
  const closed = [];
  let taxLink = 'https://siat.impuestos.gob.bo/v2/launcher/';

  // Ticket de una venta como lo arma la API: líneas iguales juntas, pagos, recibido y cambio
  const ticketOf = (sale, table, payment = {pagos: [], recibido: null, cambio: null}) => {
    const lines = new Map();
    for (const item of sale.detalles) {
      const key = `${item.nombre}|${item.precioUnitario}|${item.consumo}`;
      const current = lines.get(key) ?? {nombre: item.nombre, consumo: item.consumo, precioUnitario: item.precioUnitario, cantidad: 0, subtotal: 0};
      current.cantidad += item.cantidad;
      current.subtotal = current.precioUnitario * current.cantidad;
      lines.set(key, current);
    }
    return {
      id: sale.id, numero: sale.numero, estado: 'cobrada', mesa: table.nombre, seccion: table.seccion.nombre,
      cajero: sale.cajero, cobrador: 'admin', modificadoPor: sale.modificadoPor, abiertaEn: sale.abiertaEn, cerradaEn: new Date(now).toISOString(),
      total: sale.total, lineas: [...lines.values()], ...payment,
    };
  };
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
        const waiting = sale.detalles.filter((item) => item.listos < item.cantidad).map((item) => item.creadoEn).sort();
        venta = {id: sale.id, total: sale.total, unidades: sale.detalles.reduce((total, item) => total + item.cantidad, 0), listos: sale.detalles.reduce((total, item) => total + item.listos, 0), cajero: sale.cajero, abiertaEn: sale.abiertaEn, esperaDesde: waiting[0] ?? null};
      }
      section.mesas.push({id: table.id, nombre: table.nombre, capacidad: table.capacidad, venta});
    }
    const busy = Object.values(sales);
    return {secciones: sections, summary: {mesas: TABLES.length, ocupadas: busy.length, libres: TABLES.length - busy.length, porCobrar: busy.reduce((total, sale) => total + sale.total, 0)}};
  };

  const handlers = {
    'GET /sales/floor': () => [200, floor()],
    'GET /sales/catalog': () => [200, CATALOG],
    'GET /sales/today': () => [200, {
      hoy: '2026-10-13',
      ventas: closed.map((ticket) => ({id: ticket.id, numero: ticket.numero, mesa: ticket.mesa, cobrador: ticket.cobrador, cerradaEn: ticket.cerradaEn, total: ticket.total, pagos: ticket.pagos})),
      resumen: {
        cantidad: closed.length,
        total: closed.reduce((total, ticket) => total + ticket.total, 0),
        efectivo: closed.flatMap((ticket) => ticket.pagos).filter((item) => item.metodo === 'efectivo').reduce((total, item) => total + item.monto, 0),
        qr: closed.flatMap((ticket) => ticket.pagos).filter((item) => item.metodo === 'qr').reduce((total, item) => total + item.monto, 0),
      },
    }],
    'GET /settings': () => [200, {enlaceImpuestos: taxLink}],
    'PUT /settings': (body) => {
      calls.settings.push(body);
      if (!/^https?:\/\//.test(body.enlaceImpuestos)) {
        return [400, {message: 'Ingrese un enlace que empiece con http:// o https://'}];
      }
      taxLink = body.enlaceImpuestos;
      return [200, {enlaceImpuestos: taxLink}];
    },
  };
  // Tickets de las ventas cobradas (los ids de prueba son chicos)
  for (let id = 1; id <= MAX_TEST_SALE; id += 1) {
    handlers[`GET /sales/${id}/receipt`] = () => {
      const ticket = closed.find((item) => item.id === id);
      if (!ticket) {
        return [404, {message: 'Pedido no encontrado'}];
      }
      return [200, {ticket}];
    };
  }
  // Impresiones del ticket: las tres primeras salen, desde la cuarta pide un empleado de Caja (admin con Brasa2026)
  const printsOf = {};
  for (let id = 1; id <= MAX_TEST_SALE; id += 1) {
    handlers[`POST /sales/${id}/prints`] = (body) => {
      calls.prints.push({id, body});
      const previous = printsOf[id] ?? [];
      if (previous.length >= 3) {
        if (!body.alias || !body.contrasena) {
          return [403, {message: 'Este ticket ya se imprimió 3 veces. Un empleado con acceso a Caja debe ingresar su usuario y contraseña', motivo: 'autorizacion', impresiones: previous}];
        }
        if (body.alias !== 'admin' || body.contrasena !== 'Brasa2026') {
          return [400, {message: 'Usuario o contraseña incorrectos', motivo: 'autorizacion', campo: 'contrasena'}];
        }
      }
      let autorizadoPor = null;
      if (previous.length >= 3) {
        autorizadoPor = 'Marco Vargas';
      }
      const item = {numero: previous.length + 1, impresoPor: 'admin', autorizadoPor, impresoEn: new Date(now).toISOString()};
      printsOf[id] = [...previous, item];
      return [201, {numero: item.numero, impresiones: printsOf[id]}];
    };
  }
  // Marcar listos: por línea (sumar, restar, todos) o por envío
  const allLines = () => Object.values(sales).flatMap((sale) => sale.detalles);
  const LIMITS = {sumar: (line) => Math.min(line.cantidad, line.listos + 1), restar: (line) => Math.max(0, line.listos - 1), todos: (line) => line.cantidad, ninguno: () => 0};
  for (let id = 1; id <= 200; id += 1) {
    handlers[`PATCH /kitchen/lines/${id}`] = (body) => {
      const line = allLines().find((item) => item.id === id);
      if (!line) {
        return [404, {message: 'La línea no existe o su pedido ya se cerró'}];
      }
      calls.marks.push({line: id, accion: body.accion});
      line.listos = LIMITS[body.accion](line);
      return [200, {envios: []}];
    };
  }
  for (const sale of [7, 8, 9]) {
    for (const envio of [1, 2, 3]) {
      handlers[`PATCH /kitchen/shipments/${sale}/${envio}`] = (body) => {
        const found = Object.values(sales).find((item) => item.id === sale);
        calls.marks.push({sale, envio, accion: body.accion});
        found.detalles.filter((item) => item.envio === envio).forEach((item) => {
          item.listos = LIMITS[body.accion](item);
        });
        return [200, {envios: []}];
      };
    }
  }
  // Marca todo lo pedido como listo en cocina
  control.readyAll = () => Object.values(sales).forEach((sale) => sale.detalles.forEach((item) => {
    item.listos = item.cantidad;
  }));
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
        sales[table.id] = {id: nextSale, numero: nextSale, total: 0, envios: 0, abiertaEn: stamp, cajero: 'admin', modificado: false, modificadoPor: null, comandas: [], detalles: []};
        nextSale += 1;
      }
      const sale = sales[table.id];
      sale.envios += 1;
      sale.comandas.push({envio: sale.envios, cajero: 'admin', creadoEn: stamp});
      if (sale.envios > 1) {
        sale.modificado = true;
        sale.modificadoPor = 'admin';
      }
      for (const item of body.items) {
        nextDetail += 1;
        const line = lineFrom(item);
        sale.detalles.push(detail(nextDetail, sale.envios, line, 'admin', stamp));
        sale.total += line.precio * line.cantidad;
      }
      return [201, {mesa: table, venta: structuredClone(sale), nueva: created, envio: sale.envios, sinStock: control.shortages}];
    };
    handlers[`POST /sales/tables/${table.id}/checkout`] = (body) => {
      calls.checkouts.push({idMesa: table.id, body});
      const sale = sales[table.id];
      if (control.checkoutError) {
        return [409, {message: control.checkoutError}];
      }
      const cash = body.pagos.find((item) => item.metodo === 'efectivo');
      let payment = {pagos: body.pagos, recibido: null, cambio: null};
      if (cash) {
        const recibido = body.recibido ?? cash.monto;
        payment = {pagos: body.pagos, recibido, cambio: recibido - cash.monto};
      }
      const ticket = ticketOf(sale, table, payment);
      closed.unshift(ticket);
      delete sales[table.id];
      return [201, {ticket}];
    };
  }
  return {handlers, calls, control, sales};
};
