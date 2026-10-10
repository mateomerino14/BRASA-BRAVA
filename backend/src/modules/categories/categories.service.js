import {createImageActions} from '../shared/imageActions.js';
import {syncChildren} from '../shared/syncChildren.js';

const notFound = {error: 'Categoría no encontrada', status: 404};
const duplicateName = {error: 'Ya existe una categoría con ese nombre', status: 409};

// Convierte una fila de la base al formato que consume el frontend
const toCategory = (row, subcategories) => ({
  id: row.id_categoria,
  nombre: row.nombre,
  descripcion: row.descripcion,
  imagenUrl: row.imagen_url,
  activa: row.activa,
  subcategorias: subcategories
    .filter((sub) => sub.id_categoria === row.id_categoria)
    .map((sub) => ({id: sub.id_subcategoria, nombre: sub.nombre})),
  totalProductos: row.total_productos ?? 0,
});

// Reglas de negocio de categorías y subcategorías
export const createCategoriesService = ({repository, transaction, images}) => {
  // Arma el detalle de una categoría con sus subcategorías activas
  const getById = async (id) => {
    const row = await repository.findById(id);
    if (!row) {
      return notFound;
    }
    const subcategories = await repository.activeSubcategories([id]);
    return {category: toCategory(row, subcategories)};
  };

  // Devuelve una página del listado con el total para la paginación
  const list = async (filters) => {
    const rows = await repository.list(filters);
    const total = await repository.count(filters);
    const subcategories = await repository.activeSubcategories(rows.map((row) => row.id_categoria));
    return {items: rows.map((row) => toCategory(row, subcategories)), total, page: filters.page, pageSize: filters.pageSize};
  };

  // Registra una categoría con sus subcategorías en una sola transacción
  const create = async (data) => {
    const duplicate = await repository.findByName(data.nombre);
    if (duplicate) {
      return duplicateName;
    }
    const id = await transaction(async (tx) => {
      const newId = await tx.insert(data);
      for (const subcategory of data.subcategorias) {
        await tx.insertSubcategory(newId, subcategory.nombre);
      }
      return newId;
    });
    return getById(id);
  };

  // Modifica una categoría: renombra, agrega y da de baja subcategorías según la lista enviada
  const update = async (id, data) => {
    const current = await repository.findById(id);
    if (!current) {
      return notFound;
    }
    const duplicate = await repository.findByName(data.nombre, id);
    if (duplicate) {
      return duplicateName;
    }
    const existing = await repository.activeSubcategories([id]);
    await transaction(async (tx) => {
      await tx.update(id, data);
      await syncChildren({
        existingIds: existing.map((sub) => sub.id_subcategoria),
        incoming: data.subcategorias,
        update: (sub) => tx.renameSubcategory(id, sub.id, sub.nombre),
        insert: (sub) => tx.insertSubcategory(id, sub.nombre),
        deactivateExcept: (keepIds) => tx.deactivateSubcategoriesExcept(id, keepIds),
      });
    });
    return getById(id);
  };

  // Da de baja o reactiva una categoría
  const setStatus = async (id, activa) => {
    const current = await repository.findById(id);
    if (!current) {
      return notFound;
    }
    await repository.setActive(id, activa);
    return getById(id);
  };

  return {list, getById, create, update, setStatus, ...createImageActions({repository, images, getById, notFound})};
};
