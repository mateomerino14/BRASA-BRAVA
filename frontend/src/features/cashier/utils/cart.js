const PERCENT = 100;
const round2 = (value) => Math.round(value * PERCENT) / PERCENT;

const exclusionKey = (item) => `${item.idProducto}:${item.idInsumo}`;

export const lineKey = ({tipo, id, consumo, exclusiones}) => [tipo, id, consumo, exclusiones.map(exclusionKey).sort().join(',')].join('|');

export const lineSubtotal = (line) => round2(line.precio * line.cantidad);

export const addAmounts = (...values) => round2(values.reduce((total, value) => total + value, 0));

export const cartTotal = (lines) => addAmounts(...lines.map(lineSubtotal));

export const cartUnits = (lines) => lines.reduce((total, line) => total + line.cantidad, 0);

export const addLine = (lines, line, max) => {
  const key = lineKey(line);
  const existing = lines.find((item) => item.key === key);
  if (!existing) {
    return [...lines, {...line, key}];
  }
  return lines.map((item) => {
    if (item.key !== key) {
      return item;
    }
    return {...item, cantidad: Math.min(max, item.cantidad + line.cantidad)};
  });
};

export const replaceLine = (lines, key, line, max) => addLine(lines.filter((item) => item.key !== key), line, max);

export const setLineQuantity = (lines, key, cantidad) => lines.map((item) => {
  if (item.key !== key) {
    return item;
  }
  return {...item, cantidad};
});

export const removeLine = (lines, key) => lines.filter((item) => item.key !== key);

export const exclusionText = (exclusiones, {combo = false} = {}) => {
  if (exclusiones.length === 0) {
    return '';
  }
  if (!combo) {
    return `Sin ${exclusiones.map((item) => item.insumo.toLowerCase()).join(', ')}`;
  }
  const byProduct = new Map();
  for (const item of exclusiones) {
    if (!byProduct.has(item.producto)) {
      byProduct.set(item.producto, []);
    }
    byProduct.get(item.producto).push(item.insumo.toLowerCase());
  }
  return [...byProduct.entries()].map(([producto, insumos]) => `${producto} sin ${insumos.join(', ')}`).join(' · ');
};

export const toOrderPayload = (lines) => ({
  items: lines.map((line) => ({
    tipo: line.tipo,
    id: line.id,
    cantidad: line.cantidad,
    consumo: line.consumo,
    exclusiones: line.exclusiones.map((item) => ({idProducto: item.idProducto, idInsumo: item.idInsumo})),
  })),
});

export const groupByShipment = (detalles) => {
  const groups = new Map();
  for (const detail of detalles) {
    if (!groups.has(detail.envio)) {
      groups.set(detail.envio, {envio: detail.envio, creadoEn: detail.creadoEn, cajero: detail.cajero, detalles: []});
    }
    groups.get(detail.envio).detalles.push(detail);
  }
  return [...groups.values()];
};

export const orderTitle = (venta) => {
  if (venta) {
    return `Pedido Nº ${venta.numero}`;
  }
  return 'Nuevo pedido';
};
