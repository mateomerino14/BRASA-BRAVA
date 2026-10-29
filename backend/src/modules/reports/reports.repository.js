// Placeholders $1, $2... para una lista de ids
const placeholders = (ids) => ids.map((_, index) => `$${index + 1}`).join(', ');

// Filas de la tabla indicada para una lista de ventas (vacío si no hay ventas)
const bySales = (db, sql) => async (saleIds) => {
  if (saleIds.length === 0) {
    return [];
  }
  const {rows} = await db.query(sql(placeholders(saleIds)), saleIds);
  return rows;
};

const scheduleColumns = `id_programado, correo, tipo, dias, hora, activo, creado_en, ultimo_turno, ultimo_hasta,
       ultimo_envio_en, ultimo_atrasado, ultimo_intento_en, ultimo_error`;

// Acceso a datos de los reportes de ventas y sus envíos programados
export const createReportsRepository = (db) => ({
  // Ventas cobradas entre dos instantes, de la más antigua a la más reciente
  closedSales: async (start, end) => {
    const {rows} = await db.query(
      `SELECT v.id_venta, v.abierta_en, v.cerrada_en, v.total, v.id_cajero, v.cajero, v.id_cobrador, v.cobrador,
              v.recibido, v.cambio, v.modificado_por, m.nombre AS mesa, s.nombre AS seccion
         FROM venta v
         JOIN mesa m ON m.id_mesa = v.id_mesa JOIN seccion s ON s.id_seccion = m.id_seccion
        WHERE v.estado = 'cobrada' AND v.cerrada_en >= $1 AND v.cerrada_en < $2
        ORDER BY v.cerrada_en, v.id_venta`,
      [start, end],
    );
    return rows;
  },

  // Pagos de varias ventas
  payments: bySales(db, (ids) => `SELECT id_venta, metodo, monto FROM pago WHERE id_venta IN (${ids}) ORDER BY id_pago`),

  // Envíos de varias ventas con quién registró cada uno
  shipments: bySales(db, (ids) => `SELECT id_venta, numero, id_cajero, cajero, creado_en FROM venta_envio
     WHERE id_venta IN (${ids}) ORDER BY id_venta, numero`),

  // Líneas de varias ventas
  details: bySales(db, (ids) => `SELECT id_detalle, id_venta, envio, id_promocion, nombre, precio_unitario, cantidad, consumo
     FROM venta_detalle WHERE id_venta IN (${ids}) ORDER BY id_venta, envio, id_detalle`),

  // Ingredientes quitados de las líneas de varias ventas
  exclusions: bySales(db, (ids) => `SELECT x.id_detalle, p.nombre AS producto, i.nombre AS insumo
     FROM venta_detalle_exclusion x
     JOIN venta_detalle d ON d.id_detalle = x.id_detalle
     JOIN producto p ON p.id_producto = x.id_producto
     JOIN insumo i ON i.id_insumo = x.id_insumo
    WHERE d.id_venta IN (${ids}) ORDER BY p.nombre, i.nombre`),

  // Productos que trae cada promoción vendida en varias ventas
  comboProducts: bySales(db, (ids) => `SELECT DISTINCT pp.id_promocion, p.nombre, pp.cantidad
     FROM promocion_producto pp
     JOIN producto p ON p.id_producto = pp.id_producto
    WHERE pp.id_promocion IN (SELECT id_promocion FROM venta_detalle WHERE id_venta IN (${ids}) AND id_promocion IS NOT NULL)
    ORDER BY p.nombre`),

  // Impresiones del ticket de varias ventas
  prints: bySales(db, (ids) => `SELECT id_venta, numero, impreso_por, autorizado_por FROM ticket_impresion
     WHERE id_venta IN (${ids}) ORDER BY id_venta, numero`),

  // Empleados para filtrar el reporte (activos o no)
  employees: async () => {
    const {rows} = await db.query('SELECT id_empleado, nombre, apellido, alias, activo FROM empleado ORDER BY nombre, apellido');
    return rows;
  },

  // Empleado por id
  findEmployee: async (idEmpleado) => {
    const {rows} = await db.query('SELECT id_empleado, nombre, apellido, alias FROM empleado WHERE id_empleado = $1', [idEmpleado]);
    return rows[0] ?? null;
  },

  // Envíos programados, los activos primero
  schedules: async () => {
    const {rows} = await db.query(`SELECT ${scheduleColumns} FROM reporte_programado ORDER BY activo DESC, id_programado`);
    return rows;
  },

  // Envío programado por id
  findSchedule: async (id) => {
    const {rows} = await db.query(`SELECT ${scheduleColumns} FROM reporte_programado WHERE id_programado = $1`, [id]);
    return rows[0] ?? null;
  },

  // Registra un envío programado y devuelve su id
  insertSchedule: async ({correo, tipo, dias, hora, creadoEn}) => {
    const {rows} = await db.query(
      `INSERT INTO reporte_programado (correo, tipo, dias, hora, creado_en)
       VALUES ($1, $2, $3, $4, $5) RETURNING id_programado`,
      [correo, tipo, dias, hora, creadoEn],
    );
    return rows[0].id_programado;
  },

  // Modifica un envío programado
  updateSchedule: async (id, {correo, tipo, dias, hora}) => {
    await db.query('UPDATE reporte_programado SET correo = $2, tipo = $3, dias = $4, hora = $5 WHERE id_programado = $1', [id, correo, tipo, dias, hora]);
  },

  // Pausa o reactiva un envío programado
  setScheduleActive: async (id, activo) => {
    await db.query('UPDATE reporte_programado SET activo = $2 WHERE id_programado = $1', [id, activo]);
  },

  // Borra un envío programado
  deleteSchedule: async (id) => {
    await db.query('DELETE FROM reporte_programado WHERE id_programado = $1', [id]);
  },

  // Guarda un envío hecho: hasta dónde llegó el reporte y el turno que atendió
  markSent: async (id, {turno, hasta, enviadoEn, atrasado}) => {
    await db.query(
      `UPDATE reporte_programado SET ultimo_turno = COALESCE($2, ultimo_turno), ultimo_hasta = $3, ultimo_envio_en = $4,
              ultimo_atrasado = $5, ultimo_intento_en = $4, ultimo_error = NULL
        WHERE id_programado = $1`,
      [id, turno, hasta, enviadoEn, atrasado],
    );
  },

  // Guarda un intento fallido para reintentar más tarde
  markFailed: async (id, {intentoEn, error}) => {
    await db.query('UPDATE reporte_programado SET ultimo_intento_en = $2, ultimo_error = $3 WHERE id_programado = $1', [id, intentoEn, error]);
  },
});
