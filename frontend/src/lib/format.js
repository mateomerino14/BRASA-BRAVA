// Utilidades de formato compartidas por los componentes.

export const getInitials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

const dateFormatter = new Intl.DateTimeFormat('es-BO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const timeFormatter = new Intl.DateTimeFormat('es-BO', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

const titleCase = (text) =>
  text.replace(/\b(\p{L})(\p{L}{3,})/gu, (_, first, rest) => first.toUpperCase() + rest);

export const formatDateTime = (date) => ({
  date: titleCase(dateFormatter.format(date)),
  time: timeFormatter.format(date),
});

// Texto del pie de tabla: "Mostrando 1–5 de 12 empleados"
export const rangeText = ({page, pageSize, count, total, itemLabel}) => {
  if (total === 0) {
    return 'Sin resultados';
  }
  const from = (page - 1) * pageSize + 1;
  return `Mostrando ${from}–${from + count - 1} de ${total} ${itemLabel}`;
};

const priceFormatter = new Intl.NumberFormat('es-BO', {minimumFractionDigits: 2, maximumFractionDigits: 2});

const quantityFormatter = new Intl.NumberFormat('es-BO', {maximumFractionDigits: 3});

const UNIT_LABELS = {kg: 'kg', g: 'g', l: 'L', ml: 'ml'};

// Partes de una cantidad para mostrar número y unidad por separado: (40, 'unidad') → {amount: '40', unit: 'unidades'}
export const quantityParts = (value, unit) => {
  let label = UNIT_LABELS[unit] ?? unit;
  if (unit === 'unidad' && Math.abs(value) !== 1) {
    label = 'unidades';
  }
  return {amount: quantityFormatter.format(value), unit: label};
};

// Cantidad con su unidad: (1.5, 'kg') → "1,5 kg"; (1, 'unidad') → "1 unidad"; (40, 'unidad') → "40 unidades"
export const formatQuantity = (value, unit) => {
  const amount = quantityFormatter.format(value);
  if (unit === 'unidad' && Math.abs(value) === 1) {
    return `${amount} unidad`;
  }
  if (unit === 'unidad') {
    return `${amount} unidades`;
  }
  return `${amount} ${UNIT_LABELS[unit] ?? unit}`;
};

// Monto con separadores bolivianos: 1234.5 → "1.234,50"
export const formatAmount = (value) => priceFormatter.format(value);

// Precio en bolivianos: 1234.5 → "Bs 1.234,50"
export const formatPrice = (value) => `Bs ${formatAmount(value)}`;
