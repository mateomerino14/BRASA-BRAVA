import {round2} from '../promotions/promotionRules.js';
import {localDate} from './reportFormat.js';

// Agrupa filas por una columna: Map(valor → filas)
const groupBy = (rows, key) => {
  const groups = new Map();
  for (const row of rows) {
    if (!groups.has(row[key])) {
      groups.set(row[key], []);
    }
    groups.get(row[key]).push(row);
  }
  return groups;
};

// Suma lo pagado con un método
const paidWith = (payments, metodo) => round2(payments.filter((item) => item.metodo === metodo).reduce((total, item) => total + Number(item.monto), 0));

// Texto de lo quitado de una línea: "Sin cebolla" o, en combos, "Doble Brava sin queso cheddar"
const removedText = (exclusions, combo) => {
  if (exclusions.length === 0) {
    return '';
  }
  if (!combo) {
    return `Sin ${exclusions.map((item) => item.insumo.toLowerCase()).join(', ')}`;
  }
  const byProduct = new Map();
  for (const item of exclusions) {
    byProduct.set(item.producto, [...(byProduct.get(item.producto) ?? []), item.insumo.toLowerCase()]);
  }
  return [...byProduct.entries()].map(([producto, insumos]) => `${producto} sin ${insumos.join(', ')}`).join(' · ');
};

// La venta la registró, agregó o cobró el empleado elegido ("directorio" = sin empleado)
const involves = (sale, shipments, filter) => {
  if (filter === 'todos') {
    return true;
  }
  const ids = [sale.id_cajero, sale.id_cobrador, ...shipments.map((item) => item.id_cajero)];
  if (filter === 'directorio') {
    return ids.some((id) => id === null);
  }
  return ids.some((id) => id === filter);
};

// Arma el reporte de ventas cobradas: totales, una fila por día y cada venta con sus envíos, líneas, pagos e impresiones
export const buildSalesReport = (data, {empleado = 'todos', timeZone}) => {
  const shipmentsBySale = groupBy(data.shipments, 'id_venta');
  const sales = data.sales.filter((sale) => involves(sale, shipmentsBySale.get(sale.id_venta) ?? [], empleado));
  const paymentsBySale = groupBy(data.payments, 'id_venta');
  const detailsBySale = groupBy(data.details, 'id_venta');
  const exclusionsByDetail = groupBy(data.exclusions, 'id_detalle');
  const combos = groupBy(data.comboProducts, 'id_promocion');
  const printsBySale = groupBy(data.prints, 'id_venta');

  const ventas = sales.map((sale) => {
    const payments = paymentsBySale.get(sale.id_venta) ?? [];
    const details = groupBy(detailsBySale.get(sale.id_venta) ?? [], 'envio');
    const prints = printsBySale.get(sale.id_venta) ?? [];
    let recibido = null;
    let cambio = null;
    if (sale.recibido !== null) {
      recibido = Number(sale.recibido);
      cambio = Number(sale.cambio);
    }
    return {
      id: sale.id_venta,
      numero: sale.id_venta,
      abiertaEn: sale.abierta_en,
      cerradaEn: sale.cerrada_en,
      mesa: sale.mesa,
      seccion: sale.seccion,
      abrio: sale.cajero,
      cobrador: sale.cobrador,
      total: Number(sale.total),
      efectivo: paidWith(payments, 'efectivo'),
      qr: paidWith(payments, 'qr'),
      recibido,
      cambio,
      impresiones: prints.length,
      autorizaciones: prints.filter((item) => item.autorizado_por).map((item) => ({numero: item.numero, autorizadoPor: item.autorizado_por})),
      envios: (shipmentsBySale.get(sale.id_venta) ?? []).map((shipment) => ({
        numero: shipment.numero,
        creadoEn: shipment.creado_en,
        cajero: shipment.cajero,
        lineas: (details.get(shipment.numero) ?? []).map((line) => {
          const combo = Boolean(line.id_promocion);
          let tipo = 'producto';
          let productos = '';
          if (combo) {
            tipo = 'promocion';
            productos = (combos.get(line.id_promocion) ?? []).map((item) => `${item.cantidad} ${item.nombre}`).join(' + ');
          }
          return {
            cantidad: line.cantidad,
            nombre: line.nombre,
            tipo,
            consumo: line.consumo,
            productos,
            sin: removedText(exclusionsByDetail.get(line.id_detalle) ?? [], combo),
            subtotal: round2(Number(line.precio_unitario) * line.cantidad),
          };
        }),
      })),
    };
  });

  const days = new Map();
  for (const sale of ventas) {
    const fecha = localDate(sale.cerradaEn, timeZone);
    const day = days.get(fecha) ?? {fecha, ventas: 0, efectivo: 0, qr: 0, total: 0};
    day.ventas += 1;
    day.efectivo = round2(day.efectivo + sale.efectivo);
    day.qr = round2(day.qr + sale.qr);
    day.total = round2(day.total + sale.total);
    days.set(fecha, day);
  }
  const total = round2(ventas.reduce((sum, sale) => sum + sale.total, 0));
  let promedio = 0;
  if (ventas.length > 0) {
    promedio = round2(total / ventas.length);
  }
  return {
    resumen: {
      cantidad: ventas.length,
      total,
      efectivo: round2(ventas.reduce((sum, sale) => sum + sale.efectivo, 0)),
      qr: round2(ventas.reduce((sum, sale) => sum + sale.qr, 0)),
      promedio,
    },
    dias: [...days.values()],
    ventas,
  };
};
