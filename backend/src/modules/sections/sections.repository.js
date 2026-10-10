import {orderClause, pageClause} from '../../utils/listQuery.js';

// Mesas activas y personas por sección
const totalsJoin = `LEFT JOIN (
    SELECT id_seccion, COUNT(*)::int AS mesas, SUM(capacidad)::int AS capacidad
      FROM mesa WHERE activa = TRUE GROUP BY id_seccion
  ) t ON t.id_seccion = s.id_seccion`;
const sectionColumns = 's.id_seccion, s.nombre, s.descripcion, s.activa, COALESCE(t.mesas, 0) AS total_mesas, COALESCE(t.capacidad, 0) AS total_capacidad';

// Columnas SQL de cada clave de orden (lista blanca)
const SORT_COLUMNS = {
  nombre: ['s.nombre'],
  mesas: ['COALESCE(t.mesas, 0)'],
  capacidad: ['COALESCE(t.capacidad, 0)'],
  estado: ['s.activa'],
};
const DEFAULT_ORDER = 's.activa DESC, s.nombre, s.id_seccion';

// Arma el WHERE del listado: busca en el nombre de la sección y de sus mesas activas
const buildFilters = ({search, estado}) => {
  const conditions = [];
  const params = [];
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(LOWER(s.nombre) LIKE LOWER($${params.length}) OR s.id_seccion IN (
      SELECT m.id_seccion FROM mesa m WHERE m.activa = TRUE AND LOWER(m.nombre) LIKE LOWER($${params.length})))`);
  }
  if (estado === 'activos') {
    conditions.push('s.activa = TRUE');
  }
  if (estado === 'inactivos') {
    conditions.push('s.activa = FALSE');
  }
  let where = '';
  if (conditions.length > 0) {
    where = `WHERE ${conditions.join(' AND ')}`;
  }
  return {where, params};
};

// Acceso a datos de secciones y mesas (solo SQL, sin reglas de negocio)
export const createSectionsRepository = (db) => ({
  // Lista una página de secciones con sus totales
  list: async (filters) => {
    const {where, params} = buildFilters(filters);
    const page = pageClause(params, filters);
    const {rows} = await db.query(
      `SELECT ${sectionColumns} FROM seccion s ${totalsJoin} ${where}
        ${orderClause(SORT_COLUMNS, filters, DEFAULT_ORDER)}
        ${page.sql}`,
      page.params,
    );
    return rows;
  },

  // Cuenta las secciones que cumplen los filtros
  count: async (filters) => {
    const {where, params} = buildFilters(filters);
    const {rows} = await db.query(`SELECT COUNT(*)::int AS total FROM seccion s ${where}`, params);
    return rows[0].total;
  },

  // Totales del local: secciones activas, sus mesas activas y personas
  summary: async () => {
    const {rows} = await db.query(
      `SELECT COUNT(*)::int AS secciones, COALESCE(SUM(t.mesas), 0)::int AS mesas, COALESCE(SUM(t.capacidad), 0)::int AS capacidad
         FROM seccion s ${totalsJoin} WHERE s.activa = TRUE`,
    );
    return rows[0];
  },

  // Mesas activas de varias secciones, en orden natural de creación
  activeTables: async (sectionIds) => {
    if (sectionIds.length === 0) {
      return [];
    }
    const placeholders = sectionIds.map((_, index) => `$${index + 1}`).join(', ');
    const {rows} = await db.query(
      `SELECT id_mesa, id_seccion, nombre, capacidad FROM mesa
        WHERE activa = TRUE AND id_seccion IN (${placeholders})
        ORDER BY id_mesa`,
      sectionIds,
    );
    return rows;
  },

  // Busca una sección por id con sus totales
  findById: async (id) => {
    const {rows} = await db.query(`SELECT ${sectionColumns} FROM seccion s ${totalsJoin} WHERE s.id_seccion = $1`, [id]);
    return rows[0] ?? null;
  },

  // Busca otra sección con el mismo nombre (sin distinguir mayúsculas)
  findByName: async (nombre, excludeId = 0) => {
    const {rows} = await db.query(
      'SELECT id_seccion FROM seccion WHERE LOWER(nombre) = LOWER($1) AND id_seccion <> $2 LIMIT 1',
      [nombre, excludeId],
    );
    return rows[0] ?? null;
  },

  // Inserta una sección y devuelve su id
  insert: async ({nombre, descripcion}) => {
    const {rows} = await db.query('INSERT INTO seccion (nombre, descripcion) VALUES ($1, $2) RETURNING id_seccion', [nombre, descripcion]);
    return rows[0].id_seccion;
  },

  // Actualiza nombre y descripción
  update: async (id, {nombre, descripcion}) => {
    await db.query('UPDATE seccion SET nombre = $1, descripcion = $2 WHERE id_seccion = $3', [nombre, descripcion, id]);
  },

  // Activa o da de baja una sección
  setActive: async (id, activa) => {
    await db.query('UPDATE seccion SET activa = $1 WHERE id_seccion = $2', [activa, id]);
  },

  // Inserta una mesa en una sección
  insertTable: async (idSeccion, {nombre, capacidad}) => {
    await db.query('INSERT INTO mesa (id_seccion, nombre, capacidad) VALUES ($1, $2, $3)', [idSeccion, nombre, capacidad]);
  },

  // Cambia nombre y capacidad de una mesa activa de la sección
  updateTable: async (idSeccion, {id, nombre, capacidad}) => {
    await db.query(
      'UPDATE mesa SET nombre = $1, capacidad = $2 WHERE id_mesa = $3 AND id_seccion = $4 AND activa = TRUE',
      [nombre, capacidad, id, idSeccion],
    );
  },

  // Da de baja las mesas que ya no figuran en la lista enviada
  deactivateTablesExcept: async (idSeccion, keepIds) => {
    const params = [idSeccion, ...keepIds];
    let keep = '';
    if (keepIds.length > 0) {
      keep = `AND id_mesa NOT IN (${keepIds.map((_, index) => `$${index + 2}`).join(', ')})`;
    }
    await db.query(`UPDATE mesa SET activa = FALSE WHERE id_seccion = $1 AND activa = TRUE ${keep}`, params);
  },
});
