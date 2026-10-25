// Placeholders $1, $2... para una lista de ids
const placeholders = (ids) => ids.map((_, index) => `$${index + 1}`).join(', ');

// Ejecuta una consulta con una lista de ids (vacía → sin filas)
const withIds = async (db, ids, sql) => {
  if (ids.length === 0) {
    return [];
  }
  const {rows} = await db.query(sql(placeholders(ids)), ids);
  return rows;
};

// Ids de una columna de las filas
const idsOf = (rows, column) => rows.map((row) => row[column]);

// Acceso a datos de la eliminación física (solo el DIRECTORIO)
export const createDeletionRepository = (db) => ({
  // Registros dados de baja de cada tipo, con lo que tienen asociado
  inactiveEmployees: async () => (await db.query(
    `SELECT e.id_empleado AS id, e.nombre || ' ' || e.apellido AS nombre, e.alias, c.nombre AS cargo, COALESCE(n.ventas, 0)::int AS ventas
       FROM empleado e JOIN cargo c ON c.id_cargo = e.id_cargo
       LEFT JOIN (
         SELECT id_empleado, COUNT(DISTINCT id_venta) AS ventas FROM (
           SELECT id_cajero AS id_empleado, id_venta FROM venta
           UNION ALL SELECT id_cobrador, id_venta FROM venta
           UNION ALL SELECT id_cajero, id_venta FROM venta_envio
         ) t GROUP BY id_empleado
       ) n ON n.id_empleado = e.id_empleado
      WHERE e.activo = FALSE ORDER BY e.nombre, e.apellido`,
  )).rows,

  inactiveRoles: async () => (await db.query(
    `SELECT c.id_cargo AS id, c.nombre, COALESCE(n.empleados, 0)::int AS empleados
       FROM cargo c LEFT JOIN (SELECT id_cargo, COUNT(*) AS empleados FROM empleado GROUP BY id_cargo) n ON n.id_cargo = c.id_cargo
      WHERE c.activo = FALSE ORDER BY c.nombre`,
  )).rows,

  inactiveSections: async () => (await db.query(
    `SELECT s.id_seccion AS id, s.nombre, COALESCE(t.mesas, 0)::int AS mesas, COALESCE(n.ventas, 0)::int AS ventas
       FROM seccion s
       LEFT JOIN (SELECT id_seccion, COUNT(*) AS mesas FROM mesa GROUP BY id_seccion) t ON t.id_seccion = s.id_seccion
       LEFT JOIN (SELECT m.id_seccion, COUNT(*) AS ventas FROM venta v JOIN mesa m ON m.id_mesa = v.id_mesa GROUP BY m.id_seccion) n ON n.id_seccion = s.id_seccion
      WHERE s.activa = FALSE ORDER BY s.nombre`,
  )).rows,

  inactiveProducts: async () => (await db.query(
    `SELECT p.id_producto AS id, p.nombre, c.nombre AS categoria, COALESCE(n.ventas, 0)::int AS ventas
       FROM producto p JOIN subcategoria s ON s.id_subcategoria = p.id_subcategoria JOIN categoria c ON c.id_categoria = s.id_categoria
       LEFT JOIN (SELECT id_producto, COUNT(DISTINCT id_venta) AS ventas FROM venta_detalle GROUP BY id_producto) n ON n.id_producto = p.id_producto
      WHERE p.activo = FALSE ORDER BY p.nombre`,
  )).rows,

  inactiveCategories: async () => (await db.query(
    `SELECT c.id_categoria AS id, c.nombre, COALESCE(n.productos, 0)::int AS productos
       FROM categoria c
       LEFT JOIN (SELECT s.id_categoria, COUNT(*) AS productos FROM producto p JOIN subcategoria s ON s.id_subcategoria = p.id_subcategoria GROUP BY s.id_categoria) n
         ON n.id_categoria = c.id_categoria
      WHERE c.activa = FALSE ORDER BY c.nombre`,
  )).rows,

  inactiveIngredients: async () => (await db.query(
    `SELECT i.id_insumo AS id, i.nombre, COALESCE(n.recetas, 0)::int AS recetas
       FROM insumo i LEFT JOIN (SELECT id_insumo, COUNT(*) AS recetas FROM receta GROUP BY id_insumo) n ON n.id_insumo = i.id_insumo
      WHERE i.activo = FALSE ORDER BY i.nombre`,
  )).rows,

  inactivePromotions: async () => (await db.query(
    `SELECT p.id_promocion AS id, p.nombre, COALESCE(n.ventas, 0)::int AS ventas
       FROM promocion p LEFT JOIN (SELECT id_promocion, COUNT(DISTINCT id_venta) AS ventas FROM venta_detalle GROUP BY id_promocion) n ON n.id_promocion = p.id_promocion
      WHERE p.activa = FALSE ORDER BY p.nombre`,
  )).rows,

  // Ventas cobradas entre dos instantes, de la más reciente a la más antigua
  closedSales: async (start, end) => (await db.query(
    `SELECT v.id_venta AS id, v.cerrada_en, v.total, m.nombre AS mesa, s.nombre AS seccion, v.cobrador
       FROM venta v JOIN mesa m ON m.id_mesa = v.id_mesa JOIN seccion s ON s.id_seccion = m.id_seccion
      WHERE v.estado = 'cobrada' AND v.cerrada_en >= $1 AND v.cerrada_en < $2
      ORDER BY v.cerrada_en DESC`,
    [start, end],
  )).rows,

  // Cuáles de los ids siguen activos (no se pueden borrar)
  activeOf: (table, idColumn, activeColumn, ids, label = 'nombre') => withIds(db, ids, (list) => `SELECT ${idColumn} AS id, ${label} AS nombre FROM ${table} WHERE ${idColumn} IN (${list}) AND ${activeColumn} = TRUE`),

  // Nombres de registros por id
  namesOf: (table, idColumn, ids, label = 'nombre') => withIds(db, ids, (list) => `SELECT ${idColumn} AS id, ${label} AS nombre FROM ${table} WHERE ${idColumn} IN (${list}) ORDER BY 2`),

  // Empleados de los cargos indicados, con si siguen activos
  employeesOfRoles: (roleIds) => withIds(db, roleIds, (list) => `SELECT id_empleado AS id, nombre || ' ' || apellido AS nombre, activo FROM empleado WHERE id_cargo IN (${list}) ORDER BY nombre`),

  // Subcategorías de las categorías
  subcategoriesOf: async (categoryIds) => idsOf(await withIds(db, categoryIds, (list) => `SELECT id_subcategoria FROM subcategoria WHERE id_categoria IN (${list})`), 'id_subcategoria'),

  // Productos de las subcategorías
  productsOfSubcategories: async (subcategoryIds) => idsOf(await withIds(db, subcategoryIds, (list) => `SELECT id_producto FROM producto WHERE id_subcategoria IN (${list})`), 'id_producto'),

  // Promociones que incluyen alguno de los productos
  promotionsWithProducts: async (productIds) => idsOf(await withIds(db, productIds, (list) => `SELECT DISTINCT id_promocion FROM promocion_producto WHERE id_producto IN (${list})`), 'id_promocion'),

  // Mesas de las secciones
  tablesOf: (sectionIds) => withIds(db, sectionIds, (list) => `SELECT id_mesa AS id, nombre FROM mesa WHERE id_seccion IN (${list}) ORDER BY nombre`),

  // Ventas que dependen de cada tipo de registro
  salesOfEmployees: async (ids) => idsOf(await withIds(db, ids, (list) => `SELECT id_venta FROM venta WHERE id_cajero IN (${list}) OR id_cobrador IN (${list})
     UNION SELECT id_venta FROM venta_envio WHERE id_cajero IN (${list})`), 'id_venta'),
  salesOfTables: async (ids) => idsOf(await withIds(db, ids, (list) => `SELECT id_venta FROM venta WHERE id_mesa IN (${list})`), 'id_venta'),
  salesWithProducts: async (ids) => idsOf(await withIds(db, ids, (list) => `SELECT id_venta FROM venta_detalle WHERE id_producto IN (${list})
     UNION SELECT d.id_venta FROM venta_detalle_exclusion x JOIN venta_detalle d ON d.id_detalle = x.id_detalle WHERE x.id_producto IN (${list})`), 'id_venta'),
  salesWithPromotions: async (ids) => idsOf(await withIds(db, ids, (list) => `SELECT id_venta FROM venta_detalle WHERE id_promocion IN (${list})`), 'id_venta'),
  salesWithIngredients: async (ids) => idsOf(await withIds(db, ids, (list) => `SELECT d.id_venta FROM venta_detalle_exclusion x JOIN venta_detalle d ON d.id_detalle = x.id_detalle WHERE x.id_insumo IN (${list})`), 'id_venta'),

  // Datos de las ventas para mostrarlas y saber si alguna sigue abierta
  salesInfo: (ids) => withIds(db, ids, (list) => `SELECT v.id_venta AS id, v.estado, v.cerrada_en, v.total, m.nombre AS mesa
     FROM venta v JOIN mesa m ON m.id_mesa = v.id_mesa WHERE v.id_venta IN (${list}) ORDER BY v.id_venta`),

  // Fotos de los registros que se van a borrar
  imagesOf: (table, idColumn, column, ids) => withIds(db, ids, (list) => `SELECT ${column} AS url FROM ${table} WHERE ${idColumn} IN (${list}) AND ${column} IS NOT NULL`),

  // Borra filas por id
  deleteWhere: (table, column, ids) => withIds(db, ids, (list) => `DELETE FROM ${table} WHERE ${column} IN (${list})`),
});
