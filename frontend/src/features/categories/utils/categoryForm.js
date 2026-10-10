import {NAME_MAX_LENGTH} from '../constants/categories';

const MIN_NAME_LENGTH = 2;

// Valida el formulario con las mismas reglas que la API
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
  return errors;
};

// Convierte una categoría de la API en valores editables (key estable para las animaciones)
export const toFormValues = (category) => ({
  nombre: category.nombre,
  descripcion: category.descripcion ?? '',
  subcategorias: category.subcategorias.map((sub) => ({key: `sub-${sub.id}`, id: sub.id, nombre: sub.nombre})),
});

// Arma el cuerpo que espera la API
export const toPayload = (values) => ({
  nombre: values.nombre.trim(),
  descripcion: values.descripcion.trim(),
  subcategorias: values.subcategorias.map(({id, nombre}) => ({id, nombre})),
});
