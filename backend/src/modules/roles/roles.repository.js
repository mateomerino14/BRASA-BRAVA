import {orderClause, pageClause} from '../../utils/listQuery.js';

// Empleados activos y pantallas de cada cargo
const totalsJoin = `LEFT JOIN (
    SELECT id_cargo, COUNT(*)::int AS empleados FROM empleado WHERE activo = TRUE GROUP BY id_cargo
  ) e ON e.id_cargo = c.id_cargo
  LEFT JOIN (
    SELECT id_cargo, COUNT(*)::int AS pantallas FROM cargo_permiso WHERE pantalla <> 'home' GROUP BY id_cargo
  ) p ON p.id_cargo = c.id_cargo`;
const roleColumns = 'c.id_cargo, c.nombre, c.activo, COALESCE(e.empleados, 0) AS total_empleados';

// Columnas SQL de cada clave de orden (lista blanca)
const SORT_COLUMNS = {
  nombre: ['c.nombre'],
  empleados: ['COALESCE(e.empleados, 0)'],
  pantallas: ['COALESCE(p.pantallas, 0)'],
  estado: ['c.activo'],
};
const DEFAULT_ORDER = 'c.activo DESC, c.nombre, c.id_cargo';

// Arma el WHERE del listado de cargos
const buildFilters = ({search, estado}) => {
  const conditions = [];
  const params = [];
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`LOWER(c.nombre) LIKE LOWER($${params.length})`);
  }
  if (estado === 'activos') {
    conditions.push('c.activo = TRUE');
  }
  if (estado === 'inactivos') {
    conditions.push('c.activo = FALSE');
  }
  let where = '';
  if (conditions.length > 0) {
    where = `WHERE ${conditions.join(' AND ')}`;
  }
  return {where, params};
};

// Acceso a datos de cargos y sus permisos (solo SQL, sin reglas de negocio)
export const createRolesRepository = (db) => ({
  // Lista los cargos activos ordenados por nombre
  listActive: async () => {
    const {rows} = await db.query('SELECT id_cargo, nombre FROM cargo WHERE activo = TRUE ORDER BY nombre');
    return rows;
  },

  // Lista una página de cargos con sus totales
  list: async (filters) => {
    const {where, params} = buildFilters(filters);
    const page = pageClause(params, filters);
    const {rows} = await db.query(
      `SELECT ${roleColumns} FROM cargo c ${totalsJoin} ${where}
        ${orderClause(SORT_COLUMNS, filters, DEFAULT_ORDER)}
        ${page.sql}`,
      page.params,
    );
    return rows;
  },

  // Cuenta los cargos que cumplen los filtros
  count: async (filters) => {
    const {where, params} = buildFilters(filters);
    const {rows} = await db.query(`SELECT COUNT(*)::int AS total FROM cargo c ${where}`, params);
    return rows[0].total;
  },

  // Cargos activos, de baja y empleados activos que tienen un cargo activo
  summary: async () => {
    const {rows} = await db.query(
      `SELECT COALESCE(SUM(CASE WHEN c.activo THEN 1 ELSE 0 END), 0)::int AS cargos,
              COALESCE(SUM(CASE WHEN c.activo THEN 0 ELSE 1 END), 0)::int AS inactivos,
              COALESCE(SUM(CASE WHEN c.activo THEN COALESCE(e.empleados, 0) ELSE 0 END), 0)::int AS empleados
         FROM cargo c ${totalsJoin}`,
    );
    return rows[0];
  },

  // Pantallas de varios cargos (sin home)
  screens: async (roleIds) => {
    if (roleIds.length === 0) {
      return [];
    }
    const placeholders = roleIds.map((_, index) => `$${index + 1}`).join(', ');
    const {rows} = await db.query(
      `SELECT id_cargo, pantalla FROM cargo_permiso WHERE pantalla <> 'home' AND id_cargo IN (${placeholders})`,
      roleIds,
    );
    return rows;
  },

  // Busca un cargo por id con sus totales
  findById: async (id) => {
    const {rows} = await db.query(`SELECT ${roleColumns} FROM cargo c ${totalsJoin} WHERE c.id_cargo = $1`, [id]);
    return rows[0] ?? null;
  },

  // Busca otro cargo con el mismo nombre (sin distinguir mayúsculas)
  findByName: async (nombre, excludeId = 0) => {
    const {rows} = await db.query(
      'SELECT id_cargo FROM cargo WHERE LOWER(nombre) = LOWER($1) AND id_cargo <> $2 LIMIT 1',
      [nombre, excludeId],
    );
    return rows[0] ?? null;
  },

  // Inserta un cargo y devuelve su id
  insert: async ({nombre}) => {
    const {rows} = await db.query('INSERT INTO cargo (nombre) VALUES ($1) RETURNING id_cargo', [nombre]);
    return rows[0].id_cargo;
  },

  // Cambia el nombre de un cargo
  update: async (id, {nombre}) => {
    await db.query('UPDATE cargo SET nombre = $1 WHERE id_cargo = $2', [nombre, id]);
  },

  // Reemplaza las pantallas de un cargo
  replaceScreens: async (id, screens) => {
    await db.query('DELETE FROM cargo_permiso WHERE id_cargo = $1', [id]);
    for (const screen of screens) {
      await db.query('INSERT INTO cargo_permiso (id_cargo, pantalla) VALUES ($1, $2)', [id, screen]);
    }
  },

  // Activa o da de baja un cargo
  setActive: async (id, activo) => {
    await db.query('UPDATE cargo SET activo = $1 WHERE id_cargo = $2', [activo, id]);
  },
});
