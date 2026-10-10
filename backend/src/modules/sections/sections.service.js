import {syncChildren} from '../shared/syncChildren.js';

const notFound = {error: 'Sección no encontrada', status: 404};
const duplicateName = {error: 'Ya existe una sección con ese nombre', status: 409};

// Convierte una fila de la base al formato que consume el frontend
const toSection = (row, tables) => ({
  id: row.id_seccion,
  nombre: row.nombre,
  descripcion: row.descripcion,
  activa: row.activa,
  totalMesas: row.total_mesas,
  capacidad: row.total_capacidad,
  mesas: tables
    .filter((item) => item.id_seccion === row.id_seccion)
    .map((item) => ({id: item.id_mesa, nombre: item.nombre, capacidad: item.capacidad})),
});

// Reglas de negocio de secciones y mesas
export const createSectionsService = ({repository, transaction}) => {
  // Devuelve una sección con sus mesas activas
  const getById = async (id) => {
    const row = await repository.findById(id);
    if (!row) {
      return notFound;
    }
    return {section: toSection(row, await repository.activeTables([id]))};
  };

  // Devuelve una página del listado y el resumen del local
  const list = async (filters) => {
    const rows = await repository.list(filters);
    const total = await repository.count(filters);
    const tables = await repository.activeTables(rows.map((row) => row.id_seccion));
    const summary = await repository.summary();
    return {items: rows.map((row) => toSection(row, tables)), total, page: filters.page, pageSize: filters.pageSize, summary};
  };

  // Registra una sección con sus mesas
  const create = async (data) => {
    if (await repository.findByName(data.nombre)) {
      return duplicateName;
    }
    const id = await transaction(async (tx) => {
      const newId = await tx.insert(data);
      for (const item of data.mesas) {
        await tx.insertTable(newId, item);
      }
      return newId;
    });
    return getById(id);
  };

  // Modifica la sección y sincroniza sus mesas (las quitadas se dan de baja para conservar el historial de pedidos)
  const update = async (id, data) => {
    if (!await repository.findById(id)) {
      return notFound;
    }
    if (await repository.findByName(data.nombre, id)) {
      return duplicateName;
    }
    const existing = await repository.activeTables([id]);
    await transaction(async (tx) => {
      await tx.update(id, data);
      await syncChildren({
        existingIds: existing.map((item) => item.id_mesa),
        incoming: data.mesas,
        update: (item) => tx.updateTable(id, item),
        insert: (item) => tx.insertTable(id, item),
        deactivateExcept: (keepIds) => tx.deactivateTablesExcept(id, keepIds),
      });
    });
    return getById(id);
  };

  // Da de baja o reactiva una sección
  const setStatus = async (id, activa) => {
    if (!await repository.findById(id)) {
      return notFound;
    }
    await repository.setActive(id, activa);
    return getById(id);
  };

  return {list, getById, create, update, setStatus};
};
