import {NAME_MAX_LENGTH} from '../constants/stock';

const MIN_NAME_LENGTH = 2;
const QUANTITY_PATTERN = /^\d{1,6}([.,]\d{1,3})?$/;

const parseQuantity = (text) => Number(String(text).trim().replace(',', '.'));

const quantityError = (text, {required = true, label}) => {
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
  return '';
};

const collect = (entries) => Object.fromEntries(entries.filter(([, message]) => message));

export const validateIngredient = (values, {isEdit}) => {
  const nombre = values.nombre.trim();
  let nameError = '';
  if (nombre.length < MIN_NAME_LENGTH) {
    nameError = 'Ingrese el nombre del insumo (mínimo 2 letras)';
  }
  else if (nombre.length > NAME_MAX_LENGTH) {
    nameError = 'El nombre es demasiado largo';
  }
  let unidadError = '';
  if (!values.unidad) {
    unidadError = 'Seleccione la unidad de medida';
  }
  return collect([
    ['nombre', nameError],
    ['unidad', unidadError],
    ['stockActual', quantityError(values.stockActual, {required: isEdit, label: 'la cantidad en stock'})],
    ['stockMinimo', quantityError(values.stockMinimo, {label: 'el stock mínimo'})],
  ]);
};

const toText = (value) => String(value).replace('.', ',');

export const toFormValues = (ingredient) => ({
  nombre: ingredient.nombre,
  unidad: ingredient.unidad,
  stockActual: toText(ingredient.stockActual),
  stockMinimo: toText(ingredient.stockMinimo),
});

export const toPayload = (values, {isEdit}) => {
  const payload = {nombre: values.nombre.trim(), unidad: values.unidad, stockMinimo: parseQuantity(values.stockMinimo)};
  const quantity = String(values.stockActual).trim();
  if (isEdit) {
    payload.stockActual = parseQuantity(quantity);
  }
  else if (quantity) {
    payload.stockInicial = parseQuantity(quantity);
  }
  return payload;
};
