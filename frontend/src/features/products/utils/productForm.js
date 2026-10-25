import {NAME_MAX_LENGTH} from '../constants/products';

const MIN_NAME_LENGTH = 2;
const PRICE_PATTERN = /^\d{1,5}([.,]\d{1,2})?$/;

const parsePrice = (text) => Number(String(text).trim().replace(',', '.'));

export const validateProduct = (values) => {
  const errors = {};
  const nombre = values.nombre.trim();
  if (nombre.length < MIN_NAME_LENGTH) {
    errors.nombre = 'Ingrese el nombre del producto (mínimo 2 letras)';
  }
  else if (nombre.length > NAME_MAX_LENGTH) {
    errors.nombre = 'El nombre es demasiado largo';
  }
  const precio = String(values.precio).trim();
  if (!precio) {
    errors.precio = 'Ingrese el precio';
  }
  else if (!PRICE_PATTERN.test(precio)) {
    errors.precio = 'Ingrese un precio válido, con hasta 2 decimales';
  }
  else if (parsePrice(precio) <= 0) {
    errors.precio = 'El precio debe ser mayor a 0';
  }
  if (!values.idCategoria) {
    errors.idCategoria = 'Seleccione una categoría';
  }
  if (!values.idSubcategoria) {
    errors.idSubcategoria = 'Seleccione una subcategoría';
  }
  return errors;
};

export const toFormValues = (product) => ({
  nombre: product.nombre,
  descripcion: product.descripcion ?? '',
  precio: product.precio.toFixed(2).replace('.', ','),
  idCategoria: String(product.categoria.id),
  idSubcategoria: String(product.subcategoria.id),
});

export const toPayload = (values) => ({
  nombre: values.nombre.trim(),
  descripcion: values.descripcion.trim(),
  precio: parsePrice(values.precio),
  idSubcategoria: Number(values.idSubcategoria),
});

export const buildCategoryOptions = (categories, product) => {
  const options = categories.map((category) => ({...category, subcategorias: [...category.subcategorias]}));
  if (!product) {
    return options;
  }
  let category = options.find((item) => item.id === product.categoria.id);
  if (!category) {
    category = {id: product.categoria.id, nombre: `${product.categoria.nombre} (inactiva)`, subcategorias: []};
    options.push(category);
  }
  if (!category.subcategorias.some((sub) => sub.id === product.subcategoria.id)) {
    category.subcategorias.push({id: product.subcategoria.id, nombre: `${product.subcategoria.nombre} (inactiva)`});
  }
  return options;
};
