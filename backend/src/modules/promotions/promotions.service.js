import {createImageActions} from '../shared/imageActions.js';
import {localToday, toIsoDate} from '../../utils/calendar.js';
import {pricing, vigenciaOf} from './promotionRules.js';

const notFound = {error: 'Promoción no encontrada', status: 404};
const duplicateName = {error: 'Ya existe una promoción con ese nombre', status: 409};
const invalidProduct = {error: 'Hay productos inexistentes o dados de baja en la promoción', status: 400};
const comboNotCheaper = {error: 'El precio del combo debe ser menor que comprar los productos por separado', status: 400};

const toItem = (row) => ({idProducto: row.id_producto, nombre: row.nombre, precio: Number(row.precio), cantidad: row.cantidad, activo: row.activo});

// Convierte una fila de la base al formato que consume el frontend
const toPromotion = (row, products, today) => {
  const items = products.filter((item) => item.id_promocion === row.id_promocion).map(toItem);
  return {
    id: row.id_promocion,
    nombre: row.nombre,
    descripcion: row.descripcion,
    tipo: row.tipo,
    valor: Number(row.valor),
    fechaInicio: toIsoDate(row.fecha_inicio),
    fechaFin: toIsoDate(row.fecha_fin),
    dias: row.dias,
    imagenUrl: row.imagen_url,
    activa: row.activa,
    vigencia: vigenciaOf(row, today),
    productos: items,
    ...pricing(row.tipo, row.valor, items),
  };
};

// Reglas de negocio de promociones
export const createPromotionsService = ({repository, transaction, images, clock, timeZone}) => {
  const today = () => localToday(clock(), timeZone);

  // Devuelve una promoción con sus productos y precios
  const getById = async (id) => {
    const row = await repository.findById(id);
    if (!row) {
      return notFound;
    }
    return {promotion: toPromotion(row, await repository.products([id]), today())};
  };

  // Devuelve una página del listado y cuántas hay vigentes, programadas y vencidas
  const list = async (filters) => {
    const day = today();
    const rows = await repository.list(filters, day);
    const total = await repository.count(filters, day);
    const products = await repository.products(rows.map((row) => row.id_promocion));
    const summary = {
      vigentes: await repository.countVigencia('vigentes', day),
      programadas: await repository.countVigencia('programadas', day),
      vencidas: await repository.countVigencia('vencidas', day),
    };
    return {items: rows.map((row) => toPromotion(row, products, day)), total, page: filters.page, pageSize: filters.pageSize, summary, hoy: day.date};
  };

  // Productos activos para elegir en el formulario
  const productOptions = async () => ({
    productos: (await repository.productOptions()).map((row) => ({id: row.id_producto, nombre: row.nombre, precio: Number(row.precio), categoria: row.categoria})),
  });

  // Nombre único, productos válidos (los nuevos activos) y combo más barato que por separado
  const checkRules = async (data, currentId) => {
    if (await repository.findByName(data.nombre, currentId)) {
      return duplicateName;
    }
    let current = new Set();
    if (currentId) {
      current = new Set((await repository.products([currentId])).map((row) => row.id_producto));
    }
    const found = await repository.findProducts(data.productos.map((item) => item.idProducto));
    const usable = new Map(found.filter((row) => row.activo || current.has(row.id_producto)).map((row) => [row.id_producto, row]));
    if (data.productos.some((item) => !usable.has(item.idProducto))) {
      return invalidProduct;
    }
    const items = data.productos.map((item) => ({...item, precio: usable.get(item.idProducto).precio}));
    if (data.tipo === 'combo' && pricing('combo', data.valor, items).ahorro <= 0) {
      return comboNotCheaper;
    }
    return null;
  };

  // Registra una promoción con sus productos
  const create = async (data) => {
    const problem = await checkRules(data);
    if (problem) {
      return problem;
    }
    const id = await transaction(async (tx) => {
      const newId = await tx.insert(data);
      await tx.replaceProducts(newId, data.productos);
      return newId;
    });
    return getById(id);
  };

  // Modifica una promoción y reemplaza sus productos
  const update = async (id, data) => {
    if (!await repository.findById(id)) {
      return notFound;
    }
    const problem = await checkRules(data, id);
    if (problem) {
      return problem;
    }
    await transaction(async (tx) => {
      await tx.update(id, data);
      await tx.replaceProducts(id, data.productos);
    });
    return getById(id);
  };

  // Da de baja o reactiva una promoción
  const setStatus = async (id, activa) => {
    if (!await repository.findById(id)) {
      return notFound;
    }
    await repository.setActive(id, activa);
    return getById(id);
  };

  return {list, getById, productOptions, create, update, setStatus, ...createImageActions({repository, images, getById, notFound})};
};
