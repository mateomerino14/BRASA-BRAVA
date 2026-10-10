import {orderClause, pageClause} from '../../utils/listQuery.js';

// Columnas SQL de cada clave de orden (lista blanca)
const SORT_COLUMNS = {
  nombre: ['p.nombre'],
  precio: ['p.precio'],
  categoria: ['c.nombre', 's.nombre'],
  estado: ['p.activo'],
};
const DEFAULT_ORDER = 'p.activo DESC, c.nombre, s.nombre, p.nombre, p.id_producto';

const productColumns = `p.id_producto, p.nombre, p.descripcion, p.precio, p.imagen_url, p.activo, p.disponible,
       s.id_subcategoria, s.nombre AS subcategoria, s.activa AS subcategoria_activa,
       c.id_categoria, c.nombre AS categoria, c.activa AS categoria_activa`;

const productJoins = `FROM producto p
  JOIN subcategoria s ON s.id_subcategoria = p.id_subcategoria
  JOIN categoria c ON c.id_categoria = s.id_categoria`;

// Arma el WHERE del listado según los filtros recibidos
const buildFilters = ({search, estado, idCategoria, idSubcategoria, disponibilidad}) => {
  const conditions = [];
  const params = [];
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(LOWER(p.nombre) LIKE LOWER($${params.length}) OR LOWER(COALESCE(p.descripcion, '')) LIKE LOWER($${params.length}))`);
  }
  if (idCategoria) {
    params.push(idCategoria);
    conditions.push(`c.id_categoria = $${params.length}`);
  }
  if (idSubcategoria) {
    params.push(idSubcategoria);
    conditions.push(`s.id_subcategoria = $${params.length}`);
  }
  if (estado === 'activos') {
    conditions.push('p.activo = TRUE');
  }
  if (estado === 'inactivos') {
    conditions.push('p.activo = FALSE');
  }
  if (disponibilidad === 'disponibles') {
    conditions.push('p.disponible = TRUE');
  }
  if (disponibilidad === 'agotados') {
    conditions.push('p.disponible = FALSE');
  }
  let where = '';
  if (conditions.length > 0) {
    where = `WHERE ${conditions.join(' AND ')}`;
  }
  return {where, params};
};

// Acceso a datos de productos (solo SQL, sin reglas de negocio)
export const createProductsRepository = (db) => ({
  // Lista una página de productos con su categoría y subcategoría
  list: async (filters) => {
    const {where, params} = buildFilters(filters);
    const page = pageClause(params, filters);
    const {rows} = await db.query(
      `SELECT ${productColumns} ${productJoins} ${where}
        ${orderClause(SORT_COLUMNS, filters, DEFAULT_ORDER)}
        ${page.sql}`,
      page.params,
    );
    return rows;
  },

  // Cuenta los productos que cumplen los filtros
  count: async (filters) => {
    const {where, params} = buildFilters(filters);
    const {rows} = await db.query(`SELECT COUNT(*)::int AS total ${productJoins} ${where}`, params);
    return rows[0].total;
  },

  // Busca un producto por id con su categoría y subcategoría
  findById: async (id) => {
    const {rows} = await db.query(`SELECT ${productColumns} ${productJoins} WHERE p.id_producto = $1`, [id]);
    return rows[0] ?? null;
  },

  // Busca otro producto con el mismo nombre (sin distinguir mayúsculas)
  findByName: async (nombre, excludeId = 0) => {
    const {rows} = await db.query(
      'SELECT id_producto FROM producto WHERE LOWER(nombre) = LOWER($1) AND id_producto <> $2 LIMIT 1',
      [nombre, excludeId],
    );
    return rows[0] ?? null;
  },

  // Devuelve una subcategoría con el estado de su categoría
  findSubcategory: async (idSubcategoria) => {
    const {rows} = await db.query(
      `SELECT s.id_subcategoria, s.activa, c.activa AS categoria_activa
         FROM subcategoria s JOIN categoria c ON c.id_categoria = s.id_categoria
        WHERE s.id_subcategoria = $1`,
      [idSubcategoria],
    );
    return rows[0] ?? null;
  },

  // Categorías activas con sus subcategorías activas, para el formulario y los filtros
  options: async () => {
    const {rows} = await db.query(
      `SELECT c.id_categoria, c.nombre AS categoria, s.id_subcategoria, s.nombre AS subcategoria
         FROM categoria c JOIN subcategoria s ON s.id_categoria = c.id_categoria
        WHERE c.activa = TRUE AND s.activa = TRUE
        ORDER BY c.nombre, s.id_subcategoria`,
    );
    return rows;
  },

  // Inserta un producto y devuelve su id
  insert: async ({nombre, descripcion, precio, idSubcategoria}) => {
    const {rows} = await db.query(
      `INSERT INTO producto (nombre, descripcion, precio, id_subcategoria)
       VALUES ($1, $2, $3, $4) RETURNING id_producto`,
      [nombre, descripcion, precio, idSubcategoria],
    );
    return rows[0].id_producto;
  },

  // Actualiza los datos de un producto
  update: async (id, {nombre, descripcion, precio, idSubcategoria}) => {
    await db.query(
      'UPDATE producto SET nombre = $1, descripcion = $2, precio = $3, id_subcategoria = $4 WHERE id_producto = $5',
      [nombre, descripcion, precio, idSubcategoria, id],
    );
  },

  // Activa o da de baja un producto
  setActive: async (id, activo) => {
    await db.query('UPDATE producto SET activo = $1 WHERE id_producto = $2', [activo, id]);
  },

  // Marca un producto como disponible o agotado
  setAvailable: async (id, disponible) => {
    await db.query('UPDATE producto SET disponible = $1 WHERE id_producto = $2', [disponible, id]);
  },

  // Guarda o quita la URL de la foto de un producto
  setImage: async (id, url) => {
    await db.query('UPDATE producto SET imagen_url = $1 WHERE id_producto = $2', [url, id]);
  },
});
