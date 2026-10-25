import {NAME_MAX_LENGTH, SUBCATEGORY_NAME_MAX_LENGTH} from '../constants/categories';

const MIN_NAME_LENGTH = 2;

export const subcategoryErrorKey = (key) => `sub:${key}`;

export const validateCategory = (values) => {
  const errors = {};
  const nombre = values.nombre.trim();
  if (nombre.length < MIN_NAME_LENGTH) {
    errors.nombre = 'Ingrese el nombre de la categoría (mínimo 2 letras)';
  }
  else if (nombre.length > NAME_MAX_LENGTH) {
    errors.nombre = 'El nombre es demasiado largo';
  }
  if (values.subcategorias.length === 0) {
    errors.subcategorias = 'Agregue al menos una subcategoría';
  }
  const seen = new Set();
  for (const sub of values.subcategorias) {
    const name = sub.nombre.trim();
    const key = subcategoryErrorKey(sub.key);
    if (name.length < MIN_NAME_LENGTH) {
      errors[key] = 'Ingrese el nombre (mínimo 2 letras)';
    }
    else if (name.length > SUBCATEGORY_NAME_MAX_LENGTH) {
      errors[key] = 'El nombre es demasiado largo';
    }
    else if (seen.has(name.toLowerCase())) {
      errors[key] = 'Ya hay una subcategoría con ese nombre';
    }
    seen.add(name.toLowerCase());
  }
  return errors;
};

export const toFormValues = (category) => ({
  nombre: category.nombre,
  descripcion: category.descripcion ?? '',
  subcategorias: category.subcategorias.map((sub) => ({key: `sub-${sub.id}`, id: sub.id, nombre: sub.nombre})),
});

export const toPayload = (values) => ({
  nombre: values.nombre.trim(),
  descripcion: values.descripcion.trim(),
  subcategorias: values.subcategorias.map(({id, nombre}) => ({id, nombre: nombre.trim()})),
});
