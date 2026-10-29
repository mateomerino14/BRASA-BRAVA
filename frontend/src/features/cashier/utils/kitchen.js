import {WAIT_DANGER_MINUTES, WAIT_WARNING_MINUTES} from '../constants/cashier';

const MINUTE_MS = 60000;

export const waitMinutes = (since, now) => Math.max(0, Math.floor((now - new Date(since).getTime()) / MINUTE_MS));

export const waitTone = (minutes) => {
  if (minutes >= WAIT_DANGER_MINUTES) {
    return 'danger';
  }
  if (minutes >= WAIT_WARNING_MINUTES) {
    return 'warning';
  }
  return 'success';
};

export const removedText = (line) => {
  if (line.exclusiones.length === 0) {
    return '';
  }
  if (line.tipo !== 'promocion') {
    return `Sin ${line.exclusiones.map((item) => item.insumo.toLowerCase()).join(', ')}`;
  }
  const byProduct = new Map();
  for (const item of line.exclusiones) {
    byProduct.set(item.producto, [...(byProduct.get(item.producto) ?? []), item.insumo.toLowerCase()]);
  }
  return [...byProduct.entries()].map(([producto, insumos]) => `${producto} sin ${insumos.join(', ')}`).join(' · ');
};
