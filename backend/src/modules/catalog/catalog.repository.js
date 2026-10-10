// Placeholders $1, $2... para una lista de ids
const placeholders = (ids) => ids.map((_, index) => `$${index + 1}`).join(', ');

// Acceso a datos del catálogo (Familia): lo que el local ofrece, sin datos de gestión
export const createCatalogRepository = (db) => ({
  // Categorías y subcategorías activas
  categories: async () => {
    const {rows} = await db.query(
      `SELECT c.id_categoria, c.nombre AS categoria, s.id_subcategoria, s.nombre AS subcategoria
         FROM categoria c JOIN subcategoria s ON s.id_categoria = c.id_categoria AND s.activa = TRUE
        WHERE c.activa = TRUE
        ORDER BY c.nombre, s.id_subcategoria`,
    );
    return rows;
  },

  // Productos activos de categorías y subcategorías activas, con las porciones que alcanzan con el stock
  products: async () => {
    const {rows} = await db.query(
      `SELECT p.id_producto, p.nombre, p.descripcion, p.precio, p.imagen_url, p.disponible, rp.porciones,
              c.id_categoria, c.nombre AS categoria, s.id_subcategoria, s.nombre AS subcategoria
         FROM producto p
         JOIN subcategoria s ON s.id_subcategoria = p.id_subcategoria AND s.activa = TRUE
         JOIN categoria c ON c.id_categoria = s.id_categoria AND c.activa = TRUE
         LEFT JOIN (
           SELECT r.id_producto, MIN(CASE WHEN i.activo THEN FLOOR(i.stock_actual / r.cantidad) ELSE 0 END)::int AS porciones
             FROM receta r JOIN insumo i ON i.id_insumo = r.id_insumo
            GROUP BY r.id_producto
         ) rp ON rp.id_producto = p.id_producto
        WHERE p.activo = TRUE
        ORDER BY c.nombre, s.id_subcategoria, p.nombre`,
    );
    return rows;
  },

  // Receta de un producto con el stock de cada insumo
  recipe: async (idProducto) => {
    const {rows} = await db.query(
      `SELECT i.id_insumo, i.nombre, i.unidad, i.stock_actual, i.stock_minimo, i.activo, r.cantidad
         FROM receta r JOIN insumo i ON i.id_insumo = r.id_insumo
        WHERE r.id_producto = $1
        ORDER BY i.nombre`,
      [idProducto],
    );
    return rows;
  },

  // Promociones activas (la vigencia se calcula en el servicio)
  promotions: async () => {
    const {rows} = await db.query(
      `SELECT id_promocion, nombre, descripcion, tipo, valor, fecha_inicio, fecha_fin, dias, imagen_url, activa
         FROM promocion WHERE activa = TRUE ORDER BY nombre`,
    );
    return rows;
  },

  // Productos de las promociones indicadas con su precio actual
  promotionProducts: async (ids) => {
    if (ids.length === 0) {
      return [];
    }
    const {rows} = await db.query(
      `SELECT pp.id_promocion, pp.cantidad, p.id_producto, p.nombre, p.precio, (p.activo AND p.disponible) AS vendible
         FROM promocion_producto pp JOIN producto p ON p.id_producto = pp.id_producto
        WHERE pp.id_promocion IN (${placeholders(ids)})
        ORDER BY p.nombre`,
      ids,
    );
    return rows;
  },
});
