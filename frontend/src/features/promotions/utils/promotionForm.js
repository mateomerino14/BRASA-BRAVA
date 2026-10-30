import {ALL_DAYS} from '../../../lib/week';
import {NAME_MAX_LENGTH} from '../constants/promotions';

const MIN_NAME_LENGTH = 2;
const MIN_COMBO_ITEMS = 2;
const PRICE_PATTERN = /^\d{1,5}([.,]\d{1,2})?$/;
const PERCENT = 100;

const parseNumber = (text) => Number(String(text).trim().replace(',', '.'));
const round2 = (value) => Math.round(value * PERCENT) / PERCENT;

export const productErrorKey = (key) => `producto:${key}`;

export const emptyPromotion = (today) => ({
  nombre: '',
  descripcion: '',
  tipo: 'combo',
  valor: '',
  fechaInicio: today,
  fechaFin: '',
  horaInicio: '',
  horaFin: '',
  dias: ALL_DAYS,
  productos: [],
});

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
  return {regular, promo: value, ahorro: round2(regular - value)};
};

const validateValue = (values, pricing) => {
  const text = String(values.valor).trim();
  if (!text) {
    return 'Ingrese el precio del combo';
  }
  if (!PRICE_PATTERN.test(text) || parseNumber(text) <= 0) {
    return 'Ingrese un precio válido, con hasta 2 decimales';
  }
  if (pricing && pricing.ahorro <= 0) {
    return 'El precio del combo debe ser menor que comprar los productos por separado';
  }
  return '';
};

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
  if (values.horaInicio && !values.horaFin) {
    errors.horaFin = 'Ingrese también la hora de fin';
  }
  else if (values.horaFin && !values.horaInicio) {
    errors.horaInicio = 'Ingrese también la hora de inicio';
  }
  else if (values.horaInicio && values.horaFin <= values.horaInicio) {
    errors.horaFin = 'La hora de fin debe ser después de la de inicio';
  }
  if (values.productos.length === 0) {
    errors.productos = 'Agregue al menos un producto';
  }
  else if (values.productos.reduce((total, row) => total + row.cantidad, 0) < MIN_COMBO_ITEMS) {
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

const comboPrice = (promotion) => {
  if (promotion.tipo === 'combo') {
    return toText(promotion.valor);
  }
  return '';
};

export const toFormValues = (promotion) => ({
  nombre: promotion.nombre,
  descripcion: promotion.descripcion ?? '',
  tipo: 'combo',
  valor: comboPrice(promotion),
  fechaInicio: promotion.fechaInicio,
  fechaFin: promotion.fechaFin ?? '',
  horaInicio: promotion.horaInicio ?? '',
  horaFin: promotion.horaFin ?? '',
  dias: promotion.dias,
  productos: promotion.productos.map((item) => ({key: `producto-${item.idProducto}`, idProducto: String(item.idProducto), cantidad: item.cantidad})),
});

export const toPayload = (values) => ({
  nombre: values.nombre.trim(),
  descripcion: values.descripcion.trim(),
  tipo: 'combo',
  valor: parseNumber(values.valor),
  fechaInicio: values.fechaInicio,
  fechaFin: values.fechaFin,
  horaInicio: values.horaInicio,
  horaFin: values.horaFin,
  dias: values.dias,
  productos: values.productos.map((row) => ({idProducto: Number(row.idProducto), cantidad: row.cantidad})),
});
