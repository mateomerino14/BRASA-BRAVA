// Placeholders $1, $2... para una lista de ids, empezando en "from"
const placeholders = (ids, from = 1) => ids.map((_, index) => `$${index + from}`).join(', ');

// Porciones que alcanzan con el stock (el insumo más escaso manda; uno de baja cuenta como sin stock)
const portionsJoin = `LEFT JOIN (
    SELECT r.id_producto,
           MIN(CASE WHEN i.activo THEN FLOOR(i.stock_actual / r.cantidad) ELSE 0 END)::int AS porciones
      FROM receta r JOIN insumo i ON i.id_insumo = r.id_insumo
     GROUP BY r.id_producto
  ) rp ON rp.id_producto = p.id_producto`;

// Unidades pedidas por venta
const unitsJoin = `LEFT JOIN (
    SELECT id_venta, SUM(cantidad)::int AS unidades FROM venta_detalle GROUP BY id_venta
  ) u ON u.id_venta = v.id_venta`;

const saleColumns = `v.id_venta, v.id_mesa, v.total, v.envios, v.abierta_en, v.cajero, v.id_mesero,
       e.nombre AS mesero_nombre, e.apellido AS mesero_apellido`;

// Acceso a datos de Caja: mesas, catálogo de venta y ventas abiertas (solo SQL, sin reglas de negocio)
export const createSalesRepository = (db) => ({
  // Mesas activas de las secciones activas, con la venta abierta de cada una si la hay
  floor: async () => {
    const {rows} = await db.query(
      `SELECT s.id_seccion, s.nombre AS seccion, m.id_mesa, m.nombre, m.capacidad,
              v.id_venta, v.total, v.abierta_en, e.nombre AS mesero_nombre, e.apellido AS mesero_apellido, u.unidades
         FROM seccion s
         JOIN mesa m ON m.id_seccion = s.id_seccion AND m.activa = TRUE
         LEFT JOIN venta v ON v.id_mesa = m.id_mesa AND v.estado = 'abierta'
         LEFT JOIN empleado e ON e.id_empleado = v.id_mesero
         ${unitsJoin}
        WHERE s.activa = TRUE
        ORDER BY s.id_seccion, m.id_mesa`,
    );
    return rows;
  },

  // Productos activos de categorías y subcategorías activas, con las porciones que alcanzan
  sellableProducts: async () => {
    const {rows} = await db.query(
      `SELECT p.id_producto, p.nombre, p.descripcion, p.precio, p.imagen_url, p.disponible, rp.porciones,
              c.id_categoria, c.nombre AS categoria
         FROM producto p
         JOIN subcategoria s ON s.id_subcategoria = p.id_subcategoria
         JOIN categoria c ON c.id_categoria = s.id_categoria
         ${portionsJoin}
        WHERE p.activo = TRUE AND s.activa = TRUE AND c.activa = TRUE
        ORDER BY c.nombre, p.nombre`,
    );
    return rows;
  },

  // Ingredientes de la receta de los productos indicados (para elegir cuáles quitar)
  recipeIngredients: async (productIds) => {
    if (productIds.length === 0) {
      return [];
    }
    const {rows} = await db.query(
      `SELECT r.id_producto, i.id_insumo, i.nombre FROM receta r JOIN insumo i ON i.id_insumo = r.id_insumo
        WHERE r.id_producto IN (${placeholders(productIds)})
        ORDER BY i.nombre`,
      productIds,
    );
    return rows;
  },

  // Promociones activas (la vigencia de hoy se decide en el servicio)
  activePromotions: async () => {
    const {rows} = await db.query(
      `SELECT id_promocion, nombre, descripcion, tipo, valor, fecha_inicio, fecha_fin, dias, imagen_url, activa
         FROM promocion WHERE activa = TRUE ORDER BY nombre`,
    );
    return rows;
  },

  // Productos de las promociones indicadas, con su precio y si se pueden vender
  promotionProducts: async (promotionIds) => {
    if (promotionIds.length === 0) {
      return [];
    }
    const {rows} = await db.query(
      `SELECT pp.id_promocion, pp.id_producto, pp.cantidad, p.nombre, p.precio,
              (p.activo AND p.disponible AND s.activa AND c.activa) AS vendible
         FROM promocion_producto pp
         JOIN producto p ON p.id_producto = pp.id_producto
         JOIN subcategoria s ON s.id_subcategoria = p.id_subcategoria
         JOIN categoria c ON c.id_categoria = s.id_categoria
        WHERE pp.id_promocion IN (${placeholders(promotionIds)})
        ORDER BY p.nombre`,
      promotionIds,
    );
    return rows;
  },

  // Empleados activos cuyo cargo tiene acceso a Caja (pueden atender mesas)
  waiters: async () => {
    const {rows} = await db.query(
      `SELECT e.id_empleado, e.nombre, e.apellido, c.nombre AS cargo
         FROM empleado e JOIN cargo c ON c.id_cargo = e.id_cargo
        WHERE e.activo = TRUE AND c.activo = TRUE
          AND e.id_cargo IN (SELECT id_cargo FROM cargo_permiso WHERE pantalla = 'caja')
        ORDER BY e.nombre, e.apellido`,
    );
    return rows;
  },

  // Mesa activa con su sección (solo si la sección también está activa)
  findTable: async (idMesa) => {
    const {rows} = await db.query(
      `SELECT m.id_mesa, m.nombre, m.capacidad, s.id_seccion, s.nombre AS seccion
         FROM mesa m JOIN seccion s ON s.id_seccion = m.id_seccion
        WHERE m.id_mesa = $1 AND m.activa = TRUE AND s.activa = TRUE`,
      [idMesa],
    );
    return rows[0] ?? null;
  },

  // Bloquea la fila de la mesa hasta el fin de la transacción para que dos envíos no abran dos ventas
  lockTable: async (idMesa) => {
    await db.query('SELECT id_mesa FROM mesa WHERE id_mesa = $1 FOR UPDATE', [idMesa]);
  },

  // Venta abierta de una mesa con su mesero de apertura
  openSale: async (idMesa) => {
    const {rows} = await db.query(
      `SELECT ${saleColumns} FROM venta v JOIN empleado e ON e.id_empleado = v.id_mesero
        WHERE v.id_mesa = $1 AND v.estado = 'abierta'`,
      [idMesa],
    );
    return rows[0] ?? null;
  },

  // Líneas de una venta con el nombre del mesero de cada envío
  saleDetails: async (idVenta) => {
    const {rows} = await db.query(
      `SELECT d.id_detalle, d.envio, d.id_producto, d.id_promocion, d.nombre, d.precio_unitario, d.cantidad, d.consumo,
              d.creado_en, d.id_mesero, e.nombre AS mesero_nombre, e.apellido AS mesero_apellido
         FROM venta_detalle d JOIN empleado e ON e.id_empleado = d.id_mesero
        WHERE d.id_venta = $1
        ORDER BY d.envio, d.id_detalle`,
      [idVenta],
    );
    return rows;
  },

  // Ingredientes quitados de las líneas indicadas, con el nombre del producto y del insumo
  detailExclusions: async (detailIds) => {
    if (detailIds.length === 0) {
      return [];
    }
    const {rows} = await db.query(
      `SELECT x.id_detalle, x.id_producto, p.nombre AS producto, x.id_insumo, i.nombre AS insumo
         FROM venta_detalle_exclusion x
         JOIN producto p ON p.id_producto = x.id_producto
         JOIN insumo i ON i.id_insumo = x.id_insumo
        WHERE x.id_detalle IN (${placeholders(detailIds)})
        ORDER BY p.nombre, i.nombre`,
      detailIds,
    );
    return rows;
  },

  // Abre una venta para la mesa y devuelve su id (que es también su número correlativo)
  insertSale: async ({idMesa, idMesero, idCajero, cajero, abiertaEn}) => {
    const {rows} = await db.query(
      `INSERT INTO venta (id_mesa, id_mesero, id_cajero, cajero, abierta_en)
       VALUES ($1, $2, $3, $4, $5) RETURNING id_venta`,
      [idMesa, idMesero, idCajero, cajero, abiertaEn],
    );
    return rows[0].id_venta;
  },

  // Suma un envío y su importe a la venta; devuelve el número de este envío
  addShipment: async (idVenta, amount) => {
    const {rows} = await db.query(
      'UPDATE venta SET envios = envios + 1, total = total + $2::numeric WHERE id_venta = $1 RETURNING envios',
      [idVenta, amount],
    );
    return rows[0].envios;
  },

  // Inserta una línea de la venta y devuelve su id
  insertDetail: async ({idVenta, envio, idProducto, idPromocion, nombre, precioUnitario, cantidad, consumo, idMesero, creadoEn}) => {
    const {rows} = await db.query(
      `INSERT INTO venta_detalle (id_venta, envio, id_producto, id_promocion, nombre, precio_unitario, cantidad, consumo, id_mesero, creado_en)
       VALUES ($1, $2, $3, $4, $5, $6::numeric, $7, $8, $9, $10) RETURNING id_detalle`,
      [idVenta, envio, idProducto, idPromocion, nombre, precioUnitario, cantidad, consumo, idMesero, creadoEn],
    );
    return rows[0].id_detalle;
  },

  // Registra un ingrediente quitado de una línea
  insertExclusion: async (idDetalle, {idProducto, idInsumo}) => {
    await db.query(
      'INSERT INTO venta_detalle_exclusion (id_detalle, id_producto, id_insumo) VALUES ($1, $2, $3)',
      [idDetalle, idProducto, idInsumo],
    );
  },
});
