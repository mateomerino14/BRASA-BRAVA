const minPasswordLength = 8;
const ciPattern = /^[0-9]{5,10}(\s?[A-Za-z]{2,4})?$/;
const aliasPattern = /^[a-z0-9._]{3,30}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9]{7,8}$/;

const passwordError = (password) => {
  if (password.length < minPasswordLength) {
    return `Debe tener al menos ${minPasswordLength} caracteres`;
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Debe incluir letras y números';
  }
  return '';
};

export const validateEmployee = (values, {isEdit}) => {
  const errors = {};
  if (!values.nombre.trim()) {
    errors.nombre = 'Ingrese el nombre';
  }
  if (!values.apellido.trim()) {
    errors.apellido = 'Ingrese el apellido';
  }
  if (!ciPattern.test(values.ci.trim())) {
    errors.ci = 'Ingrese un CI válido (ej. 4920114 LP)';
  }
  if (values.telefono.trim() && !phonePattern.test(values.telefono.trim())) {
    errors.telefono = 'Debe tener 7 u 8 dígitos';
  }
  if (!aliasPattern.test(values.alias.trim().toLowerCase())) {
    errors.alias = 'Letras, números, punto o guion bajo (mínimo 3)';
  }
  if (!emailPattern.test(values.correo.trim())) {
    errors.correo = 'Ingrese un correo válido';
  }
  if (!values.idCargo) {
    errors.idCargo = 'Seleccione un cargo';
  }
  const mustValidatePassword = !isEdit || values.contrasena;
  if (mustValidatePassword) {
    const message = passwordError(values.contrasena);
    if (message) {
      errors.contrasena = message;
    }
  }
  return errors;
};

export const toPayload = (values) => ({
  nombre: values.nombre.trim(),
  apellido: values.apellido.trim(),
  ci: values.ci.trim(),
  telefono: values.telefono.trim(),
  alias: values.alias.trim().toLowerCase(),
  correo: values.correo.trim().toLowerCase(),
  idCargo: Number(values.idCargo),
  contrasena: values.contrasena,
});

export const toFormValues = (employee) => ({
  nombre: employee.nombre,
  apellido: employee.apellido,
  ci: employee.ci,
  telefono: employee.telefono ?? '',
  alias: employee.alias,
  correo: employee.correo,
  idCargo: String(employee.cargo.id),
  contrasena: '',
});
