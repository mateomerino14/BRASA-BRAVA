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

// Convierte una línea de la venta al formato del frontend
const toDetail = (row, exclusions) => {
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
    subtotal: round2(precioUnitario * row.cantidad),
    consumo: row.consumo,
    mesero: {id: row.id_mesero, nombre: fullName(row.mesero_nombre, row.mesero_apellido)},
    creadoEn: row.creado_en,
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
    return {
      id: row.id_venta,
      numero: row.id_venta,
      total: Number(row.total),
      envios: row.envios,
      abiertaEn: row.abierta_en,
      cajero: row.cajero,
      mesero: {id: row.id_mesero, nombre: fullName(row.mesero_nombre, row.mesero_apellido)},
      detalles: details.map((item) => toDetail(item, exclusions)),
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
    return {lines};
  };

  // Quién registra: el empleado de la sesión o el DIRECTORIO
  const cashierOf = (user) => {
    if (user.isDirectorio) {
      return {idCajero: null, cajero: user.alias};
    }
    return {idCajero: user.id, cajero: user.alias};
  };

  // Registra un envío de la mesa: abre la venta si está libre o suma las líneas a la venta abierta
  const addOrder = async (idMesa, {idMesero, items}, user) => {
    if (!await repository.findTable(idMesa)) {
      return tableNotFound;
    }
    if (!(await repository.waiters()).some((row) => row.id_empleado === idMesero)) {
      return invalidWaiter;
    }
    const {lines, problem} = await priceLines(items);
    if (problem) {
      return problem;
    }
    const amount = round2(lines.reduce((total, line) => total + line.precioUnitario * line.cantidad, 0));
    const now = clock();
    const register = () => transaction(async (tx) => {
      await tx.lockTable(idMesa);
      let idVenta = (await tx.openSale(idMesa))?.id_venta;
      let opened = false;
      if (!idVenta) {
        idVenta = await tx.insertSale({idMesa, idMesero, ...cashierOf(user), abiertaEn: now});
        opened = true;
      }
      const envio = await tx.addShipment(idVenta, amount);
      for (const line of lines) {
        const idDetalle = await tx.insertDetail({...line, idVenta, envio, idMesero, creadoEn: now});
        for (const exclusion of line.exclusiones) {
          await tx.insertExclusion(idDetalle, exclusion);
        }
      }
      return opened;
    });
    let created;
    try {
      created = await register();
    }
    catch (error) {
      // Otro envío abrió la venta de esta mesa al mismo tiempo: se reintenta una vez sumándose a esa venta
      if (error.code !== UNIQUE_VIOLATION) {
        throw error;
      }
      created = await register();
    }
    return {...await getTable(idMesa), created};
  };

  return {floor, catalog, waiters, getTable, addOrder};
};
