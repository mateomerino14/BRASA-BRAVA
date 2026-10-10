const PERCENT = 100;
const MINUTE_MS = 60000;
const MINUTES_PER_HOUR = 60;
const round2 = (value) => Math.round(value * PERCENT) / PERCENT;

const exclusionKey = (item) => `${item.idProducto}:${item.idInsumo}`;

// Dos líneas iguales (mismo artículo, consumo e ingredientes quitados) se juntan sumando la cantidad
export const lineKey = ({tipo, id, consumo, exclusiones}) => [tipo, id, consumo, exclusiones.map(exclusionKey).sort().join(',')].join('|');

export const lineSubtotal = (line) => round2(line.precio * line.cantidad);

export const addAmounts = (...values) => round2(values.reduce((total, value) => total + value, 0));

export const cartTotal = (lines) => addAmounts(...lines.map(lineSubtotal));

export const cartUnits = (lines) => lines.reduce((total, line) => total + line.cantidad, 0);

// Agrega una línea al pedido o suma su cantidad a la línea igual que ya exista (sin pasar del máximo)
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

// Reemplaza una línea editada; si queda igual a otra, se juntan
export const replaceLine = (lines, key, line, max) => addLine(lines.filter((item) => item.key !== key), line, max);

export const setLineQuantity = (lines, key, cantidad) => lines.map((item) => {
  if (item.key !== key) {
    return item;
  }
  return {...item, cantidad};
});

export const removeLine = (lines, key) => lines.filter((item) => item.key !== key);

// Texto de ingredientes quitados: "Sin tomate, lechuga" o, en combos, "Doble Brava sin queso cheddar"
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

// Cuerpo del envío para la API
export const toOrderPayload = (idMesero, lines) => ({
  idMesero: Number(idMesero),
  items: lines.map((line) => ({
    tipo: line.tipo,
    id: line.id,
    cantidad: line.cantidad,
    consumo: line.consumo,
    exclusiones: line.exclusiones.map((item) => ({idProducto: item.idProducto, idInsumo: item.idInsumo})),
  })),
});

// Agrupa las líneas ya registradas por envío, en orden
export const groupByShipment = (detalles) => {
  const groups = new Map();
  for (const detail of detalles) {
    if (!groups.has(detail.envio)) {
      groups.set(detail.envio, {envio: detail.envio, creadoEn: detail.creadoEn, mesero: detail.mesero.nombre, detalles: []});
    }
    groups.get(detail.envio).detalles.push(detail);
  }
  return [...groups.values()];
};

// Tiempo transcurrido desde una fecha, como texto corto: "Recién", "Hace 25 min", "Hace 1 h 5 min"
export const elapsedText = (since, now) => {
  const minutes = Math.max(0, Math.floor((now - new Date(since).getTime()) / MINUTE_MS));
  if (minutes < 1) {
    return 'Recién';
  }
  if (minutes < MINUTES_PER_HOUR) {
    return `Hace ${minutes} min`;
  }
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;
  if (rest === 0) {
    return `Hace ${hours} h`;
  }
  return `Hace ${hours} h ${rest} min`;
};

export const orderTitle = (venta) => {
  if (venta) {
    return `Pedido Nº ${venta.numero}`;
  }
  return 'Nuevo pedido';
};
