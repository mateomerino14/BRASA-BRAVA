import {orderClause, pageClause} from '../../utils/listQuery.js';

// Columnas SQL de cada clave de orden (lista blanca)
const SORT_COLUMNS = {
  nombre: ['i.nombre'],
  stock: ['i.stock_actual'],
  estado: ['i.activo'],
};
const DEFAULT_ORDER = 'i.activo DESC, i.nombre, i.id_insumo';

const ingredientColumns = 'i.id_insumo, i.nombre, i.unidad, i.stock_actual, i.stock_minimo, i.activo';

// Arma el WHERE del listado según los filtros recibidos
const buildFilters = ({search, estado, nivel}) => {
  const conditions = [];
  const params = [];
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`LOWER(i.nombre) LIKE LOWER($${params.length})`);
  }
  if (estado === 'activos') {
    conditions.push('i.activo = TRUE');
  }
  if (estado === 'inactivos') {
    conditions.push('i.activo = FALSE');
  }
  if (nivel === 'bajo') {
    conditions.push('i.stock_actual > 0 AND i.stock_actual <= i.stock_minimo');
  }
  if (nivel === 'sin_stock') {
    conditions.push('i.stock_actual = 0');
  }
  let where = '';
  if (conditions.length > 0) {
    where = `WHERE ${conditions.join(' AND ')}`;
  }
  return {where, params};
};

// Acceso a datos de insumos y movimientos de stock (solo SQL, sin reglas de negocio)
export const createIngredientsRepository = (db) => ({
  // Lista una página de insumos con los filtros dados
  list: async (filters) => {
    const {where, params} = buildFilters(filters);
    const page = pageClause(params, filters);
    const {rows} = await db.query(
      `SELECT ${ingredientColumns} FROM insumo i ${where}
        ${orderClause(SORT_COLUMNS, filters, DEFAULT_ORDER)}
        ${page.sql}`,
      page.params,
    );
    return rows;
  },

  // Cuenta los insumos que cumplen los filtros
  count: async (filters) => {
    const {where, params} = buildFilters(filters);
    const {rows} = await db.query(`SELECT COUNT(*)::int AS total FROM insumo i ${where}`, params);
    return rows[0].total;
  },

  // Totales de insumos activos: todos, con stock bajo y sin stock
  summary: async () => {
    const {rows} = await db.query(
      `SELECT COUNT(*)::int AS total,
              SUM(CASE WHEN stock_actual > 0 AND stock_actual <= stock_minimo THEN 1 ELSE 0 END)::int AS bajo,
              SUM(CASE WHEN stock_actual = 0 THEN 1 ELSE 0 END)::int AS sin_stock
         FROM insumo WHERE activo = TRUE`,
    );
    return rows[0];
  },

  // Busca un insumo por id
  findById: async (id) => {
    const {rows} = await db.query(`SELECT ${ingredientColumns} FROM insumo i WHERE i.id_insumo = $1`, [id]);
    return rows[0] ?? null;
  },

  // Busca otro insumo con el mismo nombre (sin distinguir mayúsculas)
  findByName: async (nombre, excludeId = 0) => {
    const {rows} = await db.query(
      'SELECT id_insumo FROM insumo WHERE LOWER(nombre) = LOWER($1) AND id_insumo <> $2 LIMIT 1',
      [nombre, excludeId],
    );
    return rows[0] ?? null;
  },

  // Indica si el insumo ya tiene movimientos registrados
  hasMovements: async (id) => {
    const {rows} = await db.query('SELECT 1 FROM movimiento_stock WHERE id_insumo = $1 LIMIT 1', [id]);
    return rows.length > 0;
  },

  // Inserta un insumo sin stock y devuelve su id
  insert: async ({nombre, unidad, stockMinimo}) => {
    const {rows} = await db.query(
      'INSERT INTO insumo (nombre, unidad, stock_minimo) VALUES ($1, $2, $3) RETURNING id_insumo',
      [nombre, unidad, stockMinimo],
    );
    return rows[0].id_insumo;
  },

  // Actualiza nombre, unidad y stock mínimo
  update: async (id, {nombre, unidad, stockMinimo}) => {
    await db.query(
      'UPDATE insumo SET nombre = $1, unidad = $2, stock_minimo = $3 WHERE id_insumo = $4',
      [nombre, unidad, stockMinimo, id],
    );
  },

  // Activa o da de baja un insumo
  setActive: async (id, activo) => {
    await db.query('UPDATE insumo SET activo = $1 WHERE id_insumo = $2', [activo, id]);
  },

  // Suma (o resta) al stock solo si no queda negativo; devuelve el stock nuevo o null si no alcanzó
  addStock: async (id, delta) => {
    const {rows} = await db.query(
      `UPDATE insumo SET stock_actual = stock_actual + $1
        WHERE id_insumo = $2 AND stock_actual + $1 >= 0
        RETURNING stock_actual`,
      [delta, id],
    );
    return rows[0]?.stock_actual ?? null;
  },

  // Registra un movimiento en el historial
  insertMovement: async ({idInsumo, tipo, cantidad, stockResultante, motivo, idEmpleado, responsable}) => {
    await db.query(
      `INSERT INTO movimiento_stock (id_insumo, tipo, cantidad, stock_resultante, motivo, id_empleado, responsable)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [idInsumo, tipo, cantidad, stockResultante, motivo, idEmpleado, responsable],
    );
  },

  // Devuelve una página del historial de un insumo, del más reciente al más antiguo
  movements: async (id, {page, pageSize}) => {
    const {rows} = await db.query(
      `SELECT id_movimiento, tipo, cantidad, stock_resultante, motivo, responsable, creado_en
         FROM movimiento_stock WHERE id_insumo = $1
        ORDER BY id_movimiento DESC
        LIMIT $2 OFFSET $3`,
      [id, pageSize, (page - 1) * pageSize],
    );
    return rows;
  },

  // Cuenta los movimientos de un insumo
  countMovements: async (id) => {
    const {rows} = await db.query('SELECT COUNT(*)::int AS total FROM movimiento_stock WHERE id_insumo = $1', [id]);
    return rows[0].total;
  },
});
