import {orderClause, pageClause} from '../../utils/listQuery.js';

// Columnas SQL de cada clave de orden (lista blanca)
const SORT_COLUMNS = {
  nombre: ['p.nombre'],
  inicio: ['p.fecha_inicio'],
  estado: ['p.activa'],
};
const DEFAULT_ORDER = 'p.activa DESC, p.fecha_inicio DESC, p.nombre, p.id_promocion';

const promotionColumns = 'p.id_promocion, p.nombre, p.descripcion, p.tipo, p.valor, p.fecha_inicio, p.fecha_fin, p.dias, p.imagen_url, p.activa';

// Condiciones SQL de vigencia; "hoy" (y para las vigentes, el día de la semana) llegan como parámetros en la zona del local.
// Cada una recibe el número del primer parámetro libre y devuelve su SQL y sus valores (PostgreSQL rechaza parámetros sin usar)
const VIGENCIA = {
  vigentes: (next, today) => ({
    sql: `p.activa = TRUE AND p.fecha_inicio <= $${next}::date AND (p.fecha_fin IS NULL OR p.fecha_fin >= $${next}::date)
      AND SUBSTRING(p.dias, $${next + 1}::int, 1) = '1'`,
    params: [today.date, today.weekday + 1],
  }),
  programadas: (next, today) => ({sql: `p.activa = TRUE AND p.fecha_inicio > $${next}::date`, params: [today.date]}),
  vencidas: (next, today) => ({sql: `p.fecha_fin IS NOT NULL AND p.fecha_fin < $${next}::date`, params: [today.date]}),
};

// Arma el WHERE del listado según los filtros y el día de hoy
const buildFilters = ({search, estado, tipo, vigencia}, today) => {
  const conditions = [];
  const params = [];
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(LOWER(p.nombre) LIKE LOWER($${params.length}) OR p.id_promocion IN (
      SELECT pp.id_promocion FROM promocion_producto pp JOIN producto pr ON pr.id_producto = pp.id_producto
       WHERE LOWER(pr.nombre) LIKE LOWER($${params.length})))`);
  }
  if (estado === 'activos') {
    conditions.push('p.activa = TRUE');
  }
  if (estado === 'inactivos') {
    conditions.push('p.activa = FALSE');
  }
  if (tipo && tipo !== 'todos') {
    params.push(tipo);
    conditions.push(`p.tipo = $${params.length}`);
  }
  if (VIGENCIA[vigencia]) {
    const condition = VIGENCIA[vigencia](params.length + 1, today);
    params.push(...condition.params);
    conditions.push(condition.sql);
  }
  let where = '';
  if (conditions.length > 0) {
    where = `WHERE ${conditions.join(' AND ')}`;
  }
  return {where, params};
};

// Acceso a datos de promociones (solo SQL, sin reglas de negocio)
export const createPromotionsRepository = (db) => ({
  // Lista una página de promociones con los filtros dados
  list: async (filters, today) => {
    const {where, params} = buildFilters(filters, today);
    const page = pageClause(params, filters);
    const {rows} = await db.query(
      `SELECT ${promotionColumns} FROM promocion p ${where}
        ${orderClause(SORT_COLUMNS, filters, DEFAULT_ORDER)}
        ${page.sql}`,
      page.params,
    );
    return rows;
  },

  // Cuenta las promociones que cumplen los filtros
  count: async (filters, today) => {
    const {where, params} = buildFilters(filters, today);
    const {rows} = await db.query(`SELECT COUNT(*)::int AS total FROM promocion p ${where}`, params);
    return rows[0].total;
  },

  // Cuántas promociones hay de cada vigencia
  countVigencia: async (vigencia, today) => {
    const condition = VIGENCIA[vigencia](1, today);
    const {rows} = await db.query(`SELECT COUNT(*)::int AS total FROM promocion p WHERE ${condition.sql}`, condition.params);
    return rows[0].total;
  },

  // Productos de varias promociones con su precio actual
  products: async (promotionIds) => {
    if (promotionIds.length === 0) {
      return [];
    }
    const placeholders = promotionIds.map((_, index) => `$${index + 1}`).join(', ');
    const {rows} = await db.query(
      `SELECT pp.id_promocion, pp.id_producto, pp.cantidad, pr.nombre, pr.precio, pr.activo
         FROM promocion_producto pp JOIN producto pr ON pr.id_producto = pp.id_producto
        WHERE pp.id_promocion IN (${placeholders})
        ORDER BY pr.nombre`,
      promotionIds,
    );
    return rows;
  },

  // Productos activos para armar promociones
  productOptions: async () => {
    const {rows} = await db.query(
      `SELECT pr.id_producto, pr.nombre, pr.precio, c.nombre AS categoria
         FROM producto pr JOIN subcategoria s ON s.id_subcategoria = pr.id_subcategoria
         JOIN categoria c ON c.id_categoria = s.id_categoria
        WHERE pr.activo = TRUE
        ORDER BY c.nombre, pr.nombre`,
    );
    return rows;
  },

  // Precio y estado de los productos indicados
  findProducts: async (ids) => {
    if (ids.length === 0) {
      return [];
    }
    const placeholders = ids.map((_, index) => `$${index + 1}`).join(', ');
    const {rows} = await db.query(`SELECT id_producto, precio, activo FROM producto WHERE id_producto IN (${placeholders})`, ids);
    return rows;
  },

  // Busca una promoción por id
  findById: async (id) => {
    const {rows} = await db.query(`SELECT ${promotionColumns} FROM promocion p WHERE p.id_promocion = $1`, [id]);
    return rows[0] ?? null;
  },

  // Busca otra promoción con el mismo nombre (sin distinguir mayúsculas)
  findByName: async (nombre, excludeId = 0) => {
    const {rows} = await db.query(
      'SELECT id_promocion FROM promocion WHERE LOWER(nombre) = LOWER($1) AND id_promocion <> $2 LIMIT 1',
      [nombre, excludeId],
    );
    return rows[0] ?? null;
  },

  // Inserta una promoción y devuelve su id
  insert: async ({nombre, descripcion, tipo, valor, fechaInicio, fechaFin, dias}) => {
    const {rows} = await db.query(
      `INSERT INTO promocion (nombre, descripcion, tipo, valor, fecha_inicio, fecha_fin, dias)
       VALUES ($1, $2, $3, $4, $5::date, $6::date, $7) RETURNING id_promocion`,
      [nombre, descripcion, tipo, valor, fechaInicio, fechaFin, dias],
    );
    return rows[0].id_promocion;
  },

  // Actualiza los datos de una promoción
  update: async (id, {nombre, descripcion, tipo, valor, fechaInicio, fechaFin, dias}) => {
    await db.query(
      `UPDATE promocion SET nombre = $1, descripcion = $2, tipo = $3, valor = $4, fecha_inicio = $5::date, fecha_fin = $6::date, dias = $7
        WHERE id_promocion = $8`,
      [nombre, descripcion, tipo, valor, fechaInicio, fechaFin, dias, id],
    );
  },

  // Reemplaza los productos de una promoción
  replaceProducts: async (id, items) => {
    await db.query('DELETE FROM promocion_producto WHERE id_promocion = $1', [id]);
    for (const item of items) {
      await db.query('INSERT INTO promocion_producto (id_promocion, id_producto, cantidad) VALUES ($1, $2, $3)', [id, item.idProducto, item.cantidad]);
    }
  },

  // Activa o da de baja una promoción
  setActive: async (id, activa) => {
    await db.query('UPDATE promocion SET activa = $1 WHERE id_promocion = $2', [activa, id]);
  },

  // Guarda o quita la URL de la foto
  setImage: async (id, url) => {
    await db.query('UPDATE promocion SET imagen_url = $1 WHERE id_promocion = $2', [url, id]);
  },
});
