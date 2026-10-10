import {createSalesRepository} from '../sales/sales.repository.js';

// Nuevo valor de "listos" según la acción; nunca baja de 0 ni pasa de la cantidad pedida
const LISTOS_BY_ACTION = {
  sumar: 'CASE WHEN listos < cantidad THEN listos + 1 ELSE listos END',
  restar: 'CASE WHEN listos > 0 THEN listos - 1 ELSE 0 END',
  todos: 'cantidad',
  ninguno: '0',
};

const openSaleFilter = "id_venta IN (SELECT id_venta FROM venta WHERE estado = 'abierta')";

// Acceso a datos de cocina: líneas de las ventas abiertas y su avance (reutiliza las consultas de Caja)
export const createKitchenRepository = (db) => ({
  ...createSalesRepository(db),

  // Líneas de todas las ventas abiertas con su mesa, sección y los datos de su envío
  openLines: async () => {
    const {rows} = await db.query(
      `SELECT d.id_detalle, d.id_venta, d.envio, d.id_promocion, d.nombre, d.cantidad, d.listos, d.consumo,
              m.nombre AS mesa, s.nombre AS seccion, ve.cajero, ve.creado_en,
              e.nombre AS mesero_nombre, e.apellido AS mesero_apellido
         FROM venta_detalle d
         JOIN venta v ON v.id_venta = d.id_venta AND v.estado = 'abierta'
         JOIN mesa m ON m.id_mesa = v.id_mesa
         JOIN seccion s ON s.id_seccion = m.id_seccion
         JOIN venta_envio ve ON ve.id_venta = d.id_venta AND ve.numero = d.envio
         JOIN empleado e ON e.id_empleado = ve.id_mesero
        ORDER BY ve.creado_en, d.id_venta, d.envio, d.id_detalle`,
    );
    return rows;
  },

  // Cambia las unidades listas de una línea de una venta abierta; devuelve null si no existe o ya se cerró
  updateLine: async (idDetalle, accion) => {
    const {rows} = await db.query(
      `UPDATE venta_detalle SET listos = ${LISTOS_BY_ACTION[accion]}
        WHERE id_detalle = $1 AND ${openSaleFilter}
        RETURNING id_detalle`,
      [idDetalle],
    );
    return rows[0] ?? null;
  },

  // Marca todas las líneas de un envío de una venta abierta como listas o en preparación; devuelve cuántas cambió
  updateShipment: async (idVenta, envio, accion) => {
    const {rows} = await db.query(
      `UPDATE venta_detalle SET listos = ${LISTOS_BY_ACTION[accion]}
        WHERE id_venta = $1 AND envio = $2 AND ${openSaleFilter}
        RETURNING id_detalle`,
      [idVenta, envio],
    );
    return rows.length;
  },
});
