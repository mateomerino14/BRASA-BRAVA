import {localToday} from '../../utils/calendar.js';
import {pricing, round2, vigenciaOf} from '../promotions/promotionRules.js';

const UNIQUE_VIOLATION = '23505';

const tableNotFound = {error: 'Mesa no encontrada o deshabilitada', status: 404};
const invalidWaiter = {error: 'Elija un mesero activo', status: 400};
const invalidExclusion = {error: 'Hay ingredientes quitados que no son de la receta del producto', status: 400};

// Error de un producto o promoción que no se puede vender hoy
const notSellable = (nombre, motivo) => ({error: `${nombre} ${motivo}`, status: 400});

const fullName = (nombre, apellido) => `${nombre} ${apellido}`;

// Agrupa filas por una clave: Map(clave → filas)
const groupBy = (rows, key) => {
  const groups = new Map();
  for (const row of rows) {
    if (!groups.has(row[key])) {
      groups.set(row[key], []);
    }
    groups.get(row[key]).push(row);
  }
  return groups;
};

// Ingredientes de receta de un producto en el formato del frontend
const ingredientsOf = (recipes, idProducto) => (recipes.get(idProducto) ?? []).map((row) => ({id: row.id_insumo, nombre: row.nombre}));

const THOUSAND = 1000;
// Redondea una cantidad de stock a 3 decimales
const round3 = (value) => Math.round(value * THOUSAND) / THOUSAND;

// Insumos que consume un producto: su receta por la cantidad, sin los ingredientes quitados
const addRecipeUsage = (usage, recipe, units, removed) => {
  for (const row of recipe) {
    if (removed.has(row.id_insumo)) {
      continue;
    }
    usage.set(row.id_insumo, round3((usage.get(row.id_insumo) ?? 0) + Number(row.cantidad) * units));
  }
};

// Total de cada insumo que consume un envío (en combos, la receta de cada producto por su cantidad en el combo)
export const consumptionOf = (lines, recipes, promotionItems) => {
  const usage = new Map();
  for (const line of lines) {
    const removedOf = (idProducto) => new Set(line.exclusiones.filter((item) => item.idProducto === idProducto).map((item) => item.idInsumo));
    if (line.idProducto) {
      addRecipeUsage(usage, recipes.get(line.idProducto) ?? [], line.cantidad, removedOf(line.idProducto));
      continue;
    }
    for (const item of promotionItems.get(line.idPromocion) ?? []) {
      addRecipeUsage(usage, recipes.get(item.id_producto) ?? [], line.cantidad * item.cantidad, removedOf(item.id_producto));
    }
  }
  return usage;
};

// Convierte una línea de la venta al formato del frontend
const toDetail = (row, exclusions, combos) => {
  let tipo = 'producto';
  if (row.id_promocion) {
    tipo = 'promocion';
  }
  const precioUnitario = Number(row.precio_unitario);
  return {
    id: row.id_detalle,
    envio: row.envio,
    tipo,
    idProducto: row.id_producto,
    idPromocion: row.id_promocion,
    nombre: row.nombre,
    precioUnitario,
    cantidad: row.cantidad,
    listos: row.listos,
    subtotal: round2(precioUnitario * row.cantidad),
    consumo: row.consumo,
    mesero: {id: row.id_mesero, nombre: fullName(row.mesero_nombre, row.mesero_apellido)},
    creadoEn: row.creado_en,
    productos: (combos.get(row.id_promocion) ?? []).map((item) => ({nombre: item.nombre, cantidad: item.cantidad})),
    exclusiones: (exclusions.get(row.id_detalle) ?? []).map((item) => ({
      idProducto: item.id_producto,
      producto: item.producto,
      idInsumo: item.id_insumo,
      insumo: item.insumo,
    })),
  };
};

// Reglas de negocio de Caja: plano de mesas, catálogo del día y registro de pedidos
export const createSalesService = ({repository, transaction, clock, timeZone}) => {
  const today = () => localToday(clock(), timeZone);

  // Secciones activas con sus mesas (libres u ocupadas) y el resumen del salón
  const floor = async () => {
    const rows = await repository.floor();
    const sections = [];
    for (const [idSeccion, tables] of groupBy(rows, 'id_seccion')) {
      sections.push({
        id: idSeccion,
        nombre: tables[0].seccion,
        mesas: tables.map((row) => {
          let venta = null;
          if (row.id_venta) {
            venta = {
              id: row.id_venta,
              total: Number(row.total),
              unidades: row.unidades ?? 0,
              listos: row.listos ?? 0,
              mesero: fullName(row.mesero_nombre, row.mesero_apellido),
              abiertaEn: row.abierta_en,
            };
          }
          return {id: row.id_mesa, nombre: row.nombre, capacidad: row.capacidad, venta};
        }),
      });
    }
    const occupied = rows.filter((row) => row.id_venta);
    const summary = {
      mesas: rows.length,
      ocupadas: occupied.length,
      libres: rows.length - occupied.length,
      porCobrar: round2(occupied.reduce((total, row) => total + Number(row.total), 0)),
    };
    return {secciones: sections, summary};
  };

  // Lo que se puede vender hoy: productos, promociones vigentes con sus productos y las recetas de todos ellos
  const loadToday = async () => {
    const products = await repository.sellableProducts();
    const day = today();
    const promotions = (await repository.activePromotions()).filter((row) => vigenciaOf(row, day) === 'vigente');
    const promotionItems = groupBy(await repository.promotionProducts(promotions.map((row) => row.id_promocion)), 'id_promocion');
    const productIds = new Set(products.map((row) => row.id_producto));
    for (const rows of promotionItems.values()) {
      rows.forEach((row) => productIds.add(row.id_producto));
    }
    const recipes = groupBy(await repository.recipeIngredients([...productIds]), 'id_producto');
    return {day, products, promotions, promotionItems, recipes};
  };

  // Convierte una promoción vigente al formato del catálogo
  const toCatalogPromotion = (row, items, recipes) => {
    const prices = pricing(row.tipo, row.valor, items);
    return {
      id: row.id_promocion,
      nombre: row.nombre,
      descripcion: row.descripcion,
      tipo: row.tipo,
      valor: Number(row.valor),
      imagenUrl: row.imagen_url,
      precio: prices.precioPromocion,
      precioRegular: prices.precioRegular,
      ahorro: prices.ahorro,
      productos: items.map((item) => ({
        idProducto: item.id_producto,
        nombre: item.nombre,
        cantidad: item.cantidad,
        ingredientes: ingredientsOf(recipes, item.id_producto),
      })),
    };
  };

  // Catálogo de venta: categorías, productos con su receta y promociones vigentes hoy con todos sus productos a la venta
  const catalog = async () => {
    const {day, products, promotions, promotionItems, recipes} = await loadToday();
    const categories = new Map();
    for (const row of products) {
      categories.set(row.id_categoria, {id: row.id_categoria, nombre: row.categoria});
    }
    const sellablePromotions = promotions.filter((row) => {
      const items = promotionItems.get(row.id_promocion) ?? [];
      return items.length > 0 && items.every((item) => item.vendible);
    });
    return {
      hoy: day.date,
      categorias: [...categories.values()],
      productos: products.map((row) => ({
        id: row.id_producto,
        nombre: row.nombre,
        descripcion: row.descripcion,
        precio: Number(row.precio),
        imagenUrl: row.imagen_url,
        disponible: row.disponible,
        porciones: row.porciones,
        idCategoria: row.id_categoria,
        categoria: row.categoria,
        ingredientes: ingredientsOf(recipes, row.id_producto),
      })),
      promociones: sellablePromotions.map((row) => toCatalogPromotion(row, promotionItems.get(row.id_promocion), recipes)),
    };
  };

  // Empleados que pueden atender mesas
  const waiters = async () => ({
    meseros: (await repository.waiters()).map((row) => ({id: row.id_empleado, nombre: fullName(row.nombre, row.apellido), cargo: row.cargo})),
  });

  // Venta abierta de una mesa con todas sus líneas (null si la mesa está libre)
  const saleOf = async (idMesa) => {
    const row = await repository.openSale(idMesa);
    if (!row) {
      return null;
    }
    const details = await repository.saleDetails(row.id_venta);
    const exclusions = groupBy(await repository.detailExclusions(details.map((item) => item.id_detalle)), 'id_detalle');
    const promotionIds = [...new Set(details.filter((item) => item.id_promocion).map((item) => item.id_promocion))];
    const combos = groupBy(await repository.promotionProducts(promotionIds), 'id_promocion');
    const shipments = await repository.saleShipments(row.id_venta);
    return {
      id: row.id_venta,
      numero: row.id_venta,
      total: Number(row.total),
      envios: row.envios,
      abiertaEn: row.abierta_en,
      cajero: row.cajero,
      modificado: row.modificado,
      modificadoPor: row.modificado_por,
      mesero: {id: row.id_mesero, nombre: fullName(row.mesero_nombre, row.mesero_apellido)},
      comandas: shipments.map((item) => ({
        envio: item.numero,
        cajero: item.cajero,
        mesero: {id: item.id_mesero, nombre: fullName(item.mesero_nombre, item.mesero_apellido)},
        creadoEn: item.creado_en,
      })),
      detalles: details.map((item) => toDetail(item, exclusions, combos)),
    };
  };

  // Datos de una mesa y su venta abierta
  const getTable = async (idMesa) => {
    const table = await repository.findTable(idMesa);
    if (!table) {
      return tableNotFound;
    }
    return {
      mesa: {id: table.id_mesa, nombre: table.nombre, capacidad: table.capacidad, seccion: {id: table.id_seccion, nombre: table.seccion}},
      venta: await saleOf(idMesa),
    };
  };

  // Comprueba que los ingredientes quitados sean de la receta de los productos permitidos
  const checkExclusions = (exclusions, allowedProducts, recipes) => exclusions.every((item) => (
    allowedProducts.has(item.idProducto)
    && (recipes.get(item.idProducto) ?? []).some((row) => row.id_insumo === item.idInsumo)
  ));

  // Quita ingredientes repetidos de una línea
  const uniqueExclusions = (exclusions) => {
    const seen = new Map();
    for (const item of exclusions) {
      seen.set(`${item.idProducto}-${item.idInsumo}`, item);
    }
    return [...seen.values()];
  };

  // Convierte cada línea pedida en una línea con nombre y precio de hoy, o devuelve el motivo del rechazo
  const priceLines = async (items) => {
    const loaded = await loadToday();
    const products = new Map(loaded.products.map((row) => [row.id_producto, row]));
    const promotions = new Map(loaded.promotions.map((row) => [row.id_promocion, row]));
    const {promotionItems, recipes} = loaded;
    const lines = [];
    for (const item of items) {
      const exclusiones = uniqueExclusions(item.exclusiones);
      if (item.tipo === 'producto') {
        const product = products.get(item.id);
        if (!product) {
          return {problem: notSellable('Un producto del pedido', 'ya no está a la venta')};
        }
        if (!product.disponible) {
          return {problem: notSellable(product.nombre, 'no está disponible por ahora')};
        }
        if (!checkExclusions(exclusiones, new Set([item.id]), recipes)) {
          return {problem: invalidExclusion};
        }
        lines.push({...item, exclusiones, idProducto: item.id, idPromocion: null, nombre: product.nombre, precioUnitario: Number(product.precio)});
        continue;
      }
      const promotion = promotions.get(item.id);
      const included = promotionItems.get(item.id) ?? [];
      if (!promotion || included.length === 0) {
        return {problem: notSellable('Una promoción del pedido', 'no está vigente hoy')};
      }
      if (included.some((row) => !row.vendible)) {
        return {problem: notSellable(promotion.nombre, 'tiene productos que no están disponibles')};
      }
      if (!checkExclusions(exclusiones, new Set(included.map((row) => row.id_producto)), recipes)) {
        return {problem: invalidExclusion};
      }
      const precio = pricing(promotion.tipo, promotion.valor, included).precioPromocion;
      lines.push({...item, exclusiones, idProducto: null, idPromocion: item.id, nombre: promotion.nombre, precioUnitario: precio});
    }
    return {lines, recipes, promotionItems};
  };

  // Quién registra: el empleado de la sesión o el DIRECTORIO
  const cashierOf = (user) => {
    if (user.isDirectorio) {
      return {idCajero: null, cajero: user.alias};
    }
    return {idCajero: user.id, cajero: user.alias};
  };

  // Descuenta del stock lo que consume el envío sin bloquear nunca la venta: si no alcanza, el insumo queda en 0.
  // Devuelve los nombres de los insumos que no alcanzaron
  const discountStock = async (tx, usage, {idCajero, cajero, motivo}) => {
    const shortages = [];
    for (const row of await tx.lockIngredients([...usage.keys()])) {
      if (!row.activo) {
        continue;
      }
      const before = Number(row.stock_actual);
      const need = usage.get(row.id_insumo);
      const after = round3(Math.max(0, before - need));
      if (before < need) {
        shortages.push(row.nombre);
      }
      if (after === before) {
        continue;
      }
      await tx.setStock(row.id_insumo, after);
      let detail = motivo;
      if (before < need) {
        detail = `${motivo} (stock insuficiente)`;
      }
      await tx.insertMovement({idInsumo: row.id_insumo, cantidad: round3(after - before), stockResultante: after, motivo: detail, idEmpleado: idCajero, responsable: cajero});
    }
    return shortages;
  };

  // Registra un envío de la mesa: abre la venta si está libre o suma las líneas a la venta abierta
  const addOrder = async (idMesa, {idMesero, items}, user) => {
    const table = await repository.findTable(idMesa);
    if (!table) {
      return tableNotFound;
    }
    if (!(await repository.waiters()).some((row) => row.id_empleado === idMesero)) {
      return invalidWaiter;
    }
    const {lines, problem, recipes, promotionItems} = await priceLines(items);
    if (problem) {
      return problem;
    }
    const usage = consumptionOf(lines, recipes, promotionItems);
    const cashier = cashierOf(user);
    const amount = round2(lines.reduce((total, line) => total + line.precioUnitario * line.cantidad, 0));
    const now = clock();
    const register = () => transaction(async (tx) => {
      await tx.lockTable(idMesa);
      let idVenta = (await tx.openSale(idMesa))?.id_venta;
      let opened = false;
      if (!idVenta) {
        idVenta = await tx.insertSale({idMesa, idMesero, ...cashier, abiertaEn: now});
        opened = true;
      }
      const envio = await tx.addShipment(idVenta, amount);
      await tx.insertShipment({idVenta, numero: envio, ...cashier, idMesero, creadoEn: now});
      if (envio > 1) {
        await tx.markModified(idVenta, cashier.cajero);
      }
      for (const line of lines) {
        const idDetalle = await tx.insertDetail({...line, idVenta, envio, idMesero, creadoEn: now});
        for (const exclusion of line.exclusiones) {
          await tx.insertExclusion(idDetalle, exclusion);
        }
      }
      const motivo = `Venta Nº ${idVenta} · ${table.nombre} · envío ${envio}`;
      const shortages = await discountStock(tx, usage, {...cashier, motivo});
      return {opened, envio, shortages};
    });
    let result;
    try {
      result = await register();
    }
    catch (error) {
      // Otro envío abrió la venta de esta mesa al mismo tiempo: se reintenta una vez sumándose a esa venta
      if (error.code !== UNIQUE_VIOLATION) {
        throw error;
      }
      result = await register();
    }
    return {...await getTable(idMesa), created: result.opened, envio: result.envio, sinStock: result.shortages};
  };

  return {floor, catalog, waiters, getTable, addOrder};
};
