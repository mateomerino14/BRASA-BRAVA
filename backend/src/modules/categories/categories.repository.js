import {orderClause, pageClause} from '../../utils/listQuery.js';

// Columnas SQL de cada clave de orden (lista blanca)
const SORT_COLUMNS = {
  nombre: ['c.nombre'],
  estado: ['c.activa'],
  productos: ['COALESCE(pc.total, 0)'],
};
const DEFAULT_ORDER = 'c.activa DESC, c.nombre, c.id_categoria';

// Productos activos de cada categoría (a través de sus subcategorías)
const productCountJoin = `LEFT JOIN (
    SELECT s.id_categoria, COUNT(*)::int AS total FROM producto p
      JOIN subcategoria s ON s.id_subcategoria = p.id_subcategoria
     WHERE p.activo = TRUE GROUP BY s.id_categoria
  ) pc ON pc.id_categoria = c.id_categoria`;
const categoryColumns = 'c.id_categoria, c.nombre, c.descripcion, c.imagen_url, c.activa, COALESCE(pc.total, 0) AS total_productos';

// Arma el WHERE del listado: busca en el nombre de la categoría y de sus subcategorías
const buildFilters = ({search, estado}) => {
  const conditions = [];
  const params = [];
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(LOWER(c.nombre) LIKE LOWER($${params.length}) OR c.id_categoria IN (
      SELECT s.id_categoria FROM subcategoria s WHERE s.activa = TRUE AND LOWER(s.nombre) LIKE LOWER($${params.length})))`);
  }
  if (estado === 'activos') {
    conditions.push('c.activa = TRUE');
  }
  if (estado === 'inactivos') {
    conditions.push('c.activa = FALSE');
  }
  let where = '';
  if (conditions.length > 0) {
    where = `WHERE ${conditions.join(' AND ')}`;
  }
  return {where, params};
};

// Acceso a datos de categorías y subcategorías (solo SQL, sin reglas de negocio)
export const createCategoriesRepository = (db) => ({
  // Lista una página de categorías con los filtros dados
  list: async (filters) => {
    const {where, params} = buildFilters(filters);
    const page = pageClause(params, filters);
    const {rows} = await db.query(
      `SELECT ${categoryColumns}
         FROM categoria c ${productCountJoin} ${where}
        ${orderClause(SORT_COLUMNS, filters, DEFAULT_ORDER)}
        ${page.sql}`,
      page.params,
    );
    return rows;
  },

  // Cuenta las categorías que cumplen los filtros
  count: async (filters) => {
    const {where, params} = buildFilters(filters);
    const {rows} = await db.query(`SELECT COUNT(*)::int AS total FROM categoria c ${where}`, params);
    return rows[0].total;
  },

  // Devuelve las subcategorías activas de varias categorías
  activeSubcategories: async (categoryIds) => {
    if (categoryIds.length === 0) {
      return [];
    }
    const {rows} = await db.query(
      `SELECT id_subcategoria, id_categoria, nombre FROM subcategoria
        WHERE activa = TRUE AND id_categoria = ANY($1::int[])
        ORDER BY id_subcategoria`,
      [categoryIds],
    );
    return rows;
  },

  // Busca una categoría por id
  findById: async (id) => {
    const {rows} = await db.query(
      `SELECT ${categoryColumns}
         FROM categoria c ${productCountJoin} WHERE c.id_categoria = $1`,
      [id],
    );
    return rows[0] ?? null;
  },

  // Busca otra categoría con el mismo nombre (sin distinguir mayúsculas)
  findByName: async (nombre, excludeId = 0) => {
    const {rows} = await db.query(
      'SELECT id_categoria FROM categoria WHERE LOWER(nombre) = LOWER($1) AND id_categoria <> $2 LIMIT 1',
      [nombre, excludeId],
    );
    return rows[0] ?? null;
  },

  // Inserta una categoría y devuelve su id
  insert: async ({nombre, descripcion}) => {
    const {rows} = await db.query(
      'INSERT INTO categoria (nombre, descripcion) VALUES ($1, $2) RETURNING id_categoria',
      [nombre, descripcion],
    );
    return rows[0].id_categoria;
  },

  // Actualiza el nombre y la descripción de una categoría
  update: async (id, {nombre, descripcion}) => {
    await db.query('UPDATE categoria SET nombre = $1, descripcion = $2 WHERE id_categoria = $3', [nombre, descripcion, id]);
  },

  // Activa o da de baja una categoría
  setActive: async (id, activa) => {
    await db.query('UPDATE categoria SET activa = $1 WHERE id_categoria = $2', [activa, id]);
  },

  // Guarda o quita la URL de la imagen de una categoría
  setImage: async (id, url) => {
    await db.query('UPDATE categoria SET imagen_url = $1 WHERE id_categoria = $2', [url, id]);
  },

  // Inserta una subcategoría en una categoría
  insertSubcategory: async (idCategoria, nombre) => {
    await db.query('INSERT INTO subcategoria (id_categoria, nombre) VALUES ($1, $2)', [idCategoria, nombre]);
  },

  // Renombra una subcategoría activa de la categoría indicada
  renameSubcategory: async (idCategoria, idSubcategoria, nombre) => {
    await db.query(
      'UPDATE subcategoria SET nombre = $1 WHERE id_subcategoria = $2 AND id_categoria = $3 AND activa = TRUE',
      [nombre, idSubcategoria, idCategoria],
    );
  },

  // Da de baja las subcategorías que ya no figuran en la lista enviada
  deactivateSubcategoriesExcept: async (idCategoria, keepIds) => {
    await db.query(
      'UPDATE subcategoria SET activa = FALSE WHERE id_categoria = $1 AND activa = TRUE AND NOT (id_subcategoria = ANY($2::int[]))',
      [idCategoria, keepIds],
    );
  },
});
