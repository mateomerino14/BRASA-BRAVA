import {localToday, toIsoDate} from '../../utils/calendar.js';
import {pricing, vigenciaOf} from '../promotions/promotionRules.js';
import {levelOf} from '../ingredients/ingredients.service.js';

const notFound = {error: 'Producto no encontrado en el catálogo', status: 404};

const QUANTITY_DECIMALS = 3;
// Redondea una cantidad a 3 decimales
const round3 = (value) => Number(Number(value).toFixed(QUANTITY_DECIMALS));

// Orden de las promociones: de ahora, más tarde hoy, ya terminadas por hoy, de otros días y programadas
const VIGENCIA_ORDER = {vigente: 0, mas_tarde: 1, termino_hoy: 2, otro_dia: 3, programada: 4};

// Convierte una fila de producto al formato del catálogo
const toProduct = (row) => ({
  id: row.id_producto,
  nombre: row.nombre,
  descripcion: row.descripcion,
  precio: Number(row.precio),
  imagenUrl: row.imagen_url,
  disponible: row.disponible,
  porciones: row.porciones,
  idCategoria: row.id_categoria,
  categoria: row.categoria,
  idSubcategoria: row.id_subcategoria,
  subcategoria: row.subcategoria,
});

// Agrupa las subcategorías dentro de su categoría
const toCategories = (rows) => {
  const categories = new Map();
  for (const row of rows) {
    if (!categories.has(row.id_categoria)) {
      categories.set(row.id_categoria, {id: row.id_categoria, nombre: row.categoria, subcategorias: []});
    }
    categories.get(row.id_categoria).subcategorias.push({id: row.id_subcategoria, nombre: row.subcategoria});
  }
  return [...categories.values()];
};

// Catálogo de Familia: qué se vende, a cuánto y cuánto alcanza
export const createCatalogService = ({repository, clock, timeZone}) => {
  // Categorías, productos y promociones activas que no vencieron
  const catalog = async () => {
    const day = localToday(clock(), timeZone);
    const promotions = (await repository.promotions())
      .map((row) => ({row, vigencia: vigenciaOf(row, day)}))
      .filter((item) => item.vigencia in VIGENCIA_ORDER);
    const items = await repository.promotionProducts(promotions.map((item) => item.row.id_promocion));
    return {
      hoy: day.date,
      categorias: toCategories(await repository.categories()),
      productos: (await repository.products()).map(toProduct),
      promociones: promotions
        .sort((a, b) => VIGENCIA_ORDER[a.vigencia] - VIGENCIA_ORDER[b.vigencia])
        .map(({row, vigencia}) => {
          const included = items.filter((item) => item.id_promocion === row.id_promocion);
          const prices = pricing(row.tipo, row.valor, included);
          return {
            id: row.id_promocion,
            nombre: row.nombre,
            descripcion: row.descripcion,
            tipo: row.tipo,
            valor: Number(row.valor),
            imagenUrl: row.imagen_url,
            dias: row.dias,
            fechaInicio: toIsoDate(row.fecha_inicio),
            fechaFin: toIsoDate(row.fecha_fin),
            horaInicio: row.hora_inicio,
            horaFin: row.hora_fin,
            vigencia,
            disponible: included.every((item) => item.vendible),
            precio: prices.precioPromocion,
            precioRegular: prices.precioRegular,
            ahorro: prices.ahorro,
            productos: included.map((item) => ({id: item.id_producto, nombre: item.nombre, cantidad: item.cantidad, precio: Number(item.precio)})),
          };
        }),
    };
  };

  // Detalle de un producto con su receta, stock y porciones
  const product = async (idProducto) => {
    const row = (await repository.products()).find((item) => item.id_producto === idProducto);
    if (!row) {
      return notFound;
    }
    const receta = (await repository.recipe(idProducto)).map((item) => {
      const stock = round3(item.stock_actual);
      const cantidad = round3(item.cantidad);
      let alcanza = 0;
      if (item.activo) {
        alcanza = Math.floor(stock / cantidad);
      }
      let nivel = levelOf(stock, round3(item.stock_minimo));
      if (!item.activo) {
        nivel = 'sin_stock';
      }
      return {id: item.id_insumo, nombre: item.nombre, unidad: item.unidad, cantidad, stock, activo: item.activo, nivel, alcanza};
    });
    return {producto: {...toProduct(row), receta}};
  };

  return {catalog, product};
};
