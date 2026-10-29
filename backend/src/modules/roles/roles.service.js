import {SCREENS} from '../auth/permissions.js';

const notFound = {error: 'Cargo no encontrado', status: 404};
const duplicateName = {error: 'Ya existe un cargo con ese nombre', status: 409};

// Mensaje para cuando se intenta dar de baja un cargo que todavía usan empleados activos
const inUseError = (total) => {
  let people = `${total} empleados activos tienen`;
  if (total === 1) {
    people = '1 empleado activo tiene';
  }
  return {error: `No se puede dar de baja: ${people} este cargo. Cámbieles el cargo primero`, status: 409};
};

// Ordena las pantallas como aparecen en el menú
const sortScreens = (screens) => SCREENS.filter((screen) => screens.includes(screen));

// Convierte una fila de la base al formato que consume el frontend
const toRole = (row, screens) => ({
  id: row.id_cargo,
  nombre: row.nombre,
  activo: row.activo,
  totalEmpleados: row.total_empleados,
  pantallas: sortScreens(screens.filter((item) => item.id_cargo === row.id_cargo).map((item) => item.pantalla)),
});

// Reglas de negocio de los cargos y sus permisos
export const createRolesService = ({repository, transaction}) => {
  // Devuelve los cargos activos para formularios y filtros
  const listActive = async () => {
    const rows = await repository.listActive();
    return {roles: rows.map((row) => ({id: row.id_cargo, nombre: row.nombre}))};
  };

  // Devuelve un cargo con sus pantallas
  const getById = async (id) => {
    const row = await repository.findById(id);
    if (!row) {
      return notFound;
    }
    return {role: toRole(row, await repository.screens([id]))};
  };

  // Devuelve una página del listado y el resumen
  const list = async (filters) => {
    const rows = await repository.list(filters);
    const total = await repository.count(filters);
    const screens = await repository.screens(rows.map((row) => row.id_cargo));
    const summary = await repository.summary();
    return {items: rows.map((row) => toRole(row, screens)), total, page: filters.page, pageSize: filters.pageSize, summary};
  };

  // Registra un cargo con sus pantallas (home siempre incluida)
  const create = async (data) => {
    if (await repository.findByName(data.nombre)) {
      return duplicateName;
    }
    const id = await transaction(async (tx) => {
      const newId = await tx.insert(data);
      await tx.replaceScreens(newId, ['home', ...data.pantallas]);
      return newId;
    });
    return getById(id);
  };

  // Cambia el nombre y las pantallas de un cargo
  const update = async (id, data) => {
    if (!await repository.findById(id)) {
      return notFound;
    }
    if (await repository.findByName(data.nombre, id)) {
      return duplicateName;
    }
    await transaction(async (tx) => {
      await tx.update(id, data);
      await tx.replaceScreens(id, ['home', ...data.pantallas]);
    });
    return getById(id);
  };

  // Da de baja o reactiva un cargo; no se da de baja si lo usan empleados activos
  const setStatus = async (id, activo) => {
    const row = await repository.findById(id);
    if (!row) {
      return notFound;
    }
    if (!activo && row.total_empleados > 0) {
      return inUseError(row.total_empleados);
    }
    await repository.setActive(id, activo);
    return getById(id);
  };

  return {listActive, list, getById, create, update, setStatus};
};
