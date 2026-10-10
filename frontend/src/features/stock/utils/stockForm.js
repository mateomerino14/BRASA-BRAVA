import {NAME_MAX_LENGTH} from '../constants/stock';

const MIN_NAME_LENGTH = 2;
const QUANTITY_PATTERN = /^\d{1,6}([.,]\d{1,3})?$/;
const DECIMALS = 3;

// Convierte "1,5" o "1.5" en número
export const parseQuantity = (text) => Number(String(text).trim().replace(',', '.'));

// Error de una cantidad escrita: vacía, mal formada o (si no admite cero) igual a 0
const quantityError = (text, {required = true, allowZero = true, label}) => {
  const value = String(text).trim();
  if (!value) {
    if (required) {
      return `Ingrese ${label}`;
    }
    return '';
  }
  if (!QUANTITY_PATTERN.test(value)) {
    return 'Ingrese un número válido, con hasta 3 decimales';
  }
  if (!allowZero && parseQuantity(value) <= 0) {
    return 'La cantidad debe ser mayor a 0';
  }
  return '';
};

const collect = (entries) => Object.fromEntries(entries.filter(([, message]) => message));

// Valida el formulario de insumo con las mismas reglas que la API
export const validateIngredient = (values, {isEdit}) => {
  const nombre = values.nombre.trim();
  let nombreError = '';
  if (nombre.length < MIN_NAME_LENGTH) {
    nombreError = 'Ingrese el nombre del insumo (mínimo 2 letras)';
  }
  else if (nombre.length > NAME_MAX_LENGTH) {
    nombreError = 'El nombre es demasiado largo';
  }
  let unidadError = '';
  if (!values.unidad) {
    unidadError = 'Seleccione la unidad de medida';
  }
  let inicialError = '';
  if (!isEdit) {
    inicialError = quantityError(values.stockInicial, {required: false, label: 'el stock inicial'});
  }
  return collect([
    ['nombre', nombreError],
    ['unidad', unidadError],
    ['stockMinimo', quantityError(values.stockMinimo, {label: 'el stock mínimo'})],
    ['stockInicial', inicialError],
  ]);
};

// Valida un movimiento: entrada y salida necesitan más de 0; el ajuste admite 0
export const validateMovement = (values) => collect([
  ['cantidad', quantityError(values.cantidad, {label: 'la cantidad', allowZero: values.tipo === 'ajuste'})],
]);

// Stock que quedaría tras el movimiento, o null si la cantidad todavía no es válida
export const previewStock = (current, {tipo, cantidad}) => {
  if (validateMovement({tipo, cantidad}).cantidad) {
    return null;
  }
  const amount = parseQuantity(cantidad);
  let result = current + amount;
  if (tipo === 'salida') {
    result = current - amount;
  }
  if (tipo === 'ajuste') {
    result = amount;
  }
  return Number(result.toFixed(DECIMALS));
};

const toText = (value) => String(value).replace('.', ',');

export const toFormValues = (ingredient) => ({
  nombre: ingredient.nombre,
  unidad: ingredient.unidad,
  stockMinimo: toText(ingredient.stockMinimo),
  stockInicial: '',
});

// Arma el cuerpo que espera la API (el stock inicial solo al registrar)
export const toPayload = (values, {isEdit}) => {
  const payload = {nombre: values.nombre.trim(), unidad: values.unidad, stockMinimo: parseQuantity(values.stockMinimo)};
  if (!isEdit && String(values.stockInicial).trim()) {
    payload.stockInicial = parseQuantity(values.stockInicial);
  }
  return payload;
};

export const toMovementPayload = (values) => ({
  tipo: values.tipo,
  cantidad: parseQuantity(values.cantidad),
  motivo: values.motivo.trim(),
});
