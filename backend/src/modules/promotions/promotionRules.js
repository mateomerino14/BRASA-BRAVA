import {toIsoDate} from '../../utils/calendar.js';

const PERCENT = 100;
// Redondea un monto a centavos
export const round2 = (value) => Math.round(value * PERCENT) / PERCENT;

// Precio regular (suma de productos), precio con la promoción y ahorro
export const pricing = (tipo, valor, items) => {
  const regular = round2(items.reduce((total, item) => total + Number(item.precio) * item.cantidad, 0));
  let promo = Number(valor);
  if (tipo === 'descuento') {
    promo = round2(regular * (1 - Number(valor) / PERCENT));
  }
  return {precioRegular: regular, precioPromocion: promo, ahorro: round2(regular - promo)};
};

// Vigencia para hoy: inactiva, programada, vencida, fuera de día, antes o después de su horario, o vigente
export const vigenciaOf = (row, today) => {
  const inicio = toIsoDate(row.fecha_inicio);
  const fin = toIsoDate(row.fecha_fin);
  if (!row.activa) {
    return 'inactiva';
  }
  if (fin && fin < today.date) {
    return 'vencida';
  }
  if (inicio > today.date) {
    return 'programada';
  }
  if (row.dias[today.weekday] !== '1') {
    return 'otro_dia';
  }
  if (row.hora_inicio && today.time < row.hora_inicio) {
    return 'mas_tarde';
  }
  if (row.hora_fin && today.time >= row.hora_fin) {
    return 'termino_hoy';
  }
  return 'vigente';
};
