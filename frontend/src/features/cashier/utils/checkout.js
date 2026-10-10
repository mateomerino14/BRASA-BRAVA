import {formatAmount, parseDecimal} from '../../../lib/format';
import {addAmounts} from './cart';

const CENT = 0.005;
const BILLS = [10, 20, 50, 100, 200];

export const PAYMENT_LABELS = {efectivo: 'Efectivo', qr: 'QR'};

export const emptyCheckout = {metodo: 'efectivo', recibido: '', efectivo: ''};

// Montos rápidos para el efectivo recibido: el exacto y los billetes redondos que lo cubren
export const cashSuggestions = (total) => {
  const options = [total];
  for (const bill of BILLS) {
    const rounded = Math.ceil(total / bill) * bill;
    if (rounded > total + CENT && !options.includes(rounded)) {
      options.push(rounded);
    }
  }
  return options.slice(0, 4);
};

// Lee el efectivo recibido; vacío significa "paga exacto"
const readReceived = (text, cash, errors) => {
  if (!String(text).trim()) {
    return {recibido: null, cambio: 0};
  }
  const received = parseDecimal(text);
  if (Number.isNaN(received) || received <= 0) {
    errors.recibido = 'Ingrese un monto válido';
    return {recibido: null, cambio: 0};
  }
  if (received + CENT < cash) {
    errors.recibido = `No alcanza: faltan Bs ${formatAmount(addAmounts(cash, -received))}`;
    return {recibido: received, cambio: 0};
  }
  return {recibido: received, cambio: addAmounts(received, -cash)};
};

// Arma el cobro desde el formulario: pagos para la API, cambio y errores por campo
export const buildCheckout = (values, total) => {
  const errors = {};
  if (values.metodo === 'qr') {
    return {errors, cambio: 0, payload: {pagos: [{metodo: 'qr', monto: total}]}};
  }
  let cash = total;
  const pagos = [];
  if (values.metodo === 'mixto') {
    cash = parseDecimal(values.efectivo);
    if (Number.isNaN(cash) || cash <= 0 || cash + CENT >= total) {
      errors.efectivo = `El efectivo debe ser mayor a 0 y menor que Bs ${formatAmount(total)}`;
      return {errors, cambio: 0, payload: null};
    }
    cash = addAmounts(cash);
    pagos.push({metodo: 'efectivo', monto: cash}, {metodo: 'qr', monto: addAmounts(total, -cash)});
  }
  else {
    pagos.push({metodo: 'efectivo', monto: total});
  }
  const {recibido, cambio} = readReceived(values.recibido, cash, errors);
  return {errors, cambio, payload: {pagos, recibido}};
};

// Líneas del ticket: las iguales (nombre, precio y consumo) se juntan sumando cantidad
export const receiptLines = (detalles) => {
  const lines = new Map();
  for (const detail of detalles) {
    const key = `${detail.nombre}|${detail.precioUnitario}|${detail.consumo}`;
    const current = lines.get(key) ?? {nombre: detail.nombre, consumo: detail.consumo, precioUnitario: detail.precioUnitario, cantidad: 0, subtotal: 0};
    current.cantidad += detail.cantidad;
    current.subtotal = addAmounts(current.precioUnitario * current.cantidad);
    lines.set(key, current);
  }
  return [...lines.values()];
};

// Parte por QR de un cobro mixto según el efectivo escrito (0 si todavía no es válido)
export const parseCashSplit = (values, total) => {
  const cash = parseDecimal(values.efectivo);
  if (values.metodo !== 'mixto' || Number.isNaN(cash) || cash <= 0 || cash >= total) {
    return {qr: 0};
  }
  return {qr: addAmounts(total, -cash)};
};
