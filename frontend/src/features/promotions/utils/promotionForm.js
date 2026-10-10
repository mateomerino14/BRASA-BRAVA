import {ALL_DAYS, MAX_DISCOUNT, MIN_DISCOUNT, NAME_MAX_LENGTH} from '../constants/promotions';

const MIN_NAME_LENGTH = 2;
const MIN_COMBO_ITEMS = 2;
const PRICE_PATTERN = /^\d{1,5}([.,]\d{1,2})?$/;
const PERCENT_PATTERN = /^\d{1,2}$/;
const PERCENT = 100;

const parseNumber = (text) => Number(String(text).trim().replace(',', '.'));
const round2 = (value) => Math.round(value * PERCENT) / PERCENT;

// Clave del error de una fila de producto
export const productErrorKey = (key) => `producto:${key}`;

// Valores vacíos con la fecha de hoy del local como inicio
export const emptyPromotion = (today) => ({
  nombre: '',
  descripcion: '',
  tipo: 'combo',
  valor: '',
  fechaInicio: today,
  fechaFin: '',
  dias: ALL_DAYS,
  productos: [],
});

// Precio regular de los productos elegidos, precio con la promoción y ahorro (null si aún no se puede calcular)
export const previewPricing = (values, productsById) => {
  const items = values.productos.filter((row) => productsById.has(row.idProducto));
  if (items.length === 0) {
    return null;
  }
  const regular = round2(items.reduce((total, row) => total + productsById.get(row.idProducto).precio * row.cantidad, 0));
  const value = parseNumber(values.valor);
  if (!String(values.valor).trim() || Number.isNaN(value)) {
    return {regular, promo: null, ahorro: null};
  }
  let promo = value;
  if (values.tipo === 'descuento') {
    promo = round2(regular * (1 - value / PERCENT));
  }
  return {regular, promo, ahorro: round2(regular - promo)};
};

const validateValue = (values, pricing) => {
  const text = String(values.valor).trim();
  if (!text) {
    return 'Ingrese el valor de la promoción';
  }
  if (values.tipo === 'descuento') {
    const percent = Number(text);
    if (!PERCENT_PATTERN.test(text) || percent < MIN_DISCOUNT || percent > MAX_DISCOUNT) {
      return `El descuento debe ser un porcentaje entero de ${MIN_DISCOUNT} a ${MAX_DISCOUNT}`;
    }
    return '';
  }
  if (!PRICE_PATTERN.test(text) || parseNumber(text) <= 0) {
    return 'Ingrese un precio válido, con hasta 2 decimales';
  }
  if (pricing && pricing.ahorro <= 0) {
    return 'El precio del combo debe ser menor que comprar los productos por separado';
  }
  return '';
};

// Valida la promoción con las mismas reglas que la API
export const validatePromotion = (values, {productsById = new Map()} = {}) => {
  const errors = {};
  const nombre = values.nombre.trim();
  if (nombre.length < MIN_NAME_LENGTH) {
    errors.nombre = 'Ingrese el nombre de la promoción (mínimo 2 letras)';
  }
  else if (nombre.length > NAME_MAX_LENGTH) {
    errors.nombre = 'El nombre es demasiado largo';
  }
  const valueError = validateValue(values, previewPricing(values, productsById));
  if (valueError) {
    errors.valor = valueError;
  }
  if (!values.fechaInicio) {
    errors.fechaInicio = 'Ingrese la fecha de inicio';
  }
  if (values.fechaFin && values.fechaInicio && values.fechaFin < values.fechaInicio) {
    errors.fechaFin = 'La fecha de fin no puede ser anterior al inicio';
  }
  if (!values.dias.includes('1')) {
    errors.dias = 'Elija al menos un día de la semana';
  }
  if (values.productos.length === 0) {
    errors.productos = 'Agregue al menos un producto';
  }
  else if (values.tipo === 'combo' && values.productos.reduce((total, row) => total + row.cantidad, 0) < MIN_COMBO_ITEMS) {
    errors.productos = 'Un combo necesita al menos 2 productos';
  }
  const seen = new Set();
  for (const row of values.productos) {
    if (!row.idProducto) {
      errors[productErrorKey(row.key)] = 'Seleccione un producto';
    }
    else if (seen.has(row.idProducto)) {
      errors[productErrorKey(row.key)] = 'Este producto ya está en la promoción';
    }
    seen.add(row.idProducto);
  }
  return errors;
};

const toText = (value) => String(value).replace('.', ',');

export const toFormValues = (promotion) => ({
  nombre: promotion.nombre,
  descripcion: promotion.descripcion ?? '',
  tipo: promotion.tipo,
  valor: toText(promotion.valor),
  fechaInicio: promotion.fechaInicio,
  fechaFin: promotion.fechaFin ?? '',
  dias: promotion.dias,
  productos: promotion.productos.map((item) => ({key: `producto-${item.idProducto}`, idProducto: String(item.idProducto), cantidad: item.cantidad})),
});

// El cuerpo para la API; en un descuento cada producto cuenta una vez
export const toPayload = (values) => ({
  nombre: values.nombre.trim(),
  descripcion: values.descripcion.trim(),
  tipo: values.tipo,
  valor: parseNumber(values.valor),
  fechaInicio: values.fechaInicio,
  fechaFin: values.fechaFin,
  dias: values.dias,
  productos: values.productos.map((row) => {
    let cantidad = row.cantidad;
    if (values.tipo === 'descuento') {
      cantidad = 1;
    }
    return {idProducto: Number(row.idProducto), cantidad};
  }),
});
