import {ALL_SCREENS, NAME_MAX_LENGTH} from '../constants/roles';

const MIN_NAME_LENGTH = 2;

export const validateRole = (values) => {
  const errors = {};
  const nombre = values.nombre.trim();
  if (nombre.length < MIN_NAME_LENGTH) {
    errors.nombre = 'Ingrese el nombre del cargo (mínimo 2 letras)';
  }
  else if (nombre.length > NAME_MAX_LENGTH) {
    errors.nombre = 'El nombre es demasiado largo';
  }
  if (values.pantallas.length === 0) {
    errors.pantallas = 'Marque al menos una pantalla';
  }
  return errors;
};

export const toFormValues = (role) => ({nombre: role.nombre, pantallas: [...role.pantallas]});

export const toPayload = (values) => ({
  nombre: values.nombre.trim(),
  pantallas: ALL_SCREENS.map((screen) => screen.id).filter((id) => values.pantallas.includes(id)),
});
