import {hashSecret} from '../../utils/password.js';
import {createImageActions} from '../shared/imageActions.js';

const notFound = {error: 'Empleado no encontrado', status: 404};

// Convierte una fila de la base al formato que consume el frontend
const toEmployee = (row) => ({
  id: row.id_empleado,
  nombre: row.nombre,
  apellido: row.apellido,
  ci: row.ci,
  alias: row.alias,
  correo: row.correo,
  telefono: row.telefono,
  fotoUrl: row.foto_url,
  activo: row.activo,
  cargo: {id: row.id_cargo, nombre: row.cargo},
});

// Arma el mensaje del primer dato repetido (CI, usuario o correo)
const duplicateMessage = (duplicate, data) => {
  if (duplicate.ci === data.ci) {
    return 'Ya existe un empleado con ese CI';
  }
  if (duplicate.alias.toLowerCase() === data.alias) {
    return 'Ese nombre de usuario ya está en uso';
  }
  return 'Ese correo ya está registrado';
};

// Reglas de negocio de la gestión de empleados
export const createEmployeesService = ({repository, images}) => {
  // Valida que el cargo sea válido y que no se repitan CI, usuario ni correo
  const checkConsistency = async (data, excludeId) => {
    const roleOk = await repository.roleIsActive(data.idCargo);
    if (!roleOk) {
      return {error: 'Seleccione un cargo válido', status: 400};
    }
    const duplicate = await repository.findDuplicate(data, excludeId);
    if (duplicate) {
      return {error: duplicateMessage(duplicate, data), status: 409};
    }
    return {};
  };

  // Devuelve una página del listado con el total para la paginación
  const list = async (filters) => {
    const rows = await repository.list(filters);
    const total = await repository.count(filters);
    return {items: rows.map(toEmployee), total, page: filters.page, pageSize: filters.pageSize};
  };

  // Devuelve un empleado por su id
  const getById = async (id) => {
    const row = await repository.findById(id);
    if (!row) {
      return notFound;
    }
    return {employee: toEmployee(row)};
  };

  // Registra un empleado nuevo con su contraseña inicial
  const create = async (data) => {
    const check = await checkConsistency(data);
    if (check.error) {
      return check;
    }
    const contrasenaHash = await hashSecret(data.contrasena);
    const id = await repository.insert({...data, contrasenaHash});
    return getById(id);
  };

  // Modifica un empleado; la contraseña solo cambia si se envía una nueva
  const update = async (id, data) => {
    const current = await repository.findById(id);
    if (!current) {
      return notFound;
    }
    const check = await checkConsistency(data, id);
    if (check.error) {
      return check;
    }
    let contrasenaHash = null;
    if (data.contrasena) {
      contrasenaHash = await hashSecret(data.contrasena);
    }
    await repository.update(id, {...data, contrasenaHash});
    return getById(id);
  };

  // Da de baja o reactiva a un empleado; nadie puede darse de baja a sí mismo
  const setStatus = async (id, activo, actor) => {
    const current = await repository.findById(id);
    if (!current) {
      return notFound;
    }
    if (!activo && !actor.isDirectorio && actor.id === id) {
      return {error: 'No puede dar de baja su propia cuenta', status: 400};
    }
    await repository.setActive(id, activo);
    return getById(id);
  };

  return {list, getById, create, update, setStatus, ...createImageActions({repository, images, getById, notFound, imageOf: (row) => row.foto_url})};
};
