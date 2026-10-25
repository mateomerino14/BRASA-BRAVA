
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
const pad = (value) => String(value).padStart(2, '0');
const NOON = 12;

const toTwelveHour = (hours, minutes) => {
  let period = 'AM';
  if (hours >= NOON) {
    period = 'PM';
  }
  const hour = hours % NOON || NOON;
  return {clock: `${hour}:${pad(minutes)}`, period};
};

const titleCase = (text) =>
  text.replace(/\b(\p{L})(\p{L}{3,})/gu, (_, first, rest) => first.toUpperCase() + rest);

export const formatDateTime = (date) => {
  const {clock, period} = toTwelveHour(date.getHours(), date.getMinutes());
  return {
    date: titleCase(dateFormatter.format(date)),
    time: `${clock}:${pad(date.getSeconds())} ${period}`,
    clock,
    period,
  };
};

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

export const quantityParts = (value, unit) => {
  let label = UNIT_LABELS[unit] ?? unit;
  if (unit === 'unidad' && Math.abs(value) !== 1) {
    label = 'unidades';
  }
  return {amount: quantityFormatter.format(value), unit: label};
};

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

export const formatAmount = (value) => priceFormatter.format(value);

export const formatPrice = (value) => `Bs ${formatAmount(value)}`;

const shortDateFormatter = new Intl.DateTimeFormat('es-BO', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'});

export const formatDate = (isoDate) => shortDateFormatter.format(new Date(`${isoDate}T00:00:00Z`)).replace('.', '');

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const WEEKDAYS = '0111110';
const WEEKEND = '1000001';

export const formatDays = (days) => {
  const selected = [1, 2, 3, 4, 5, 6, 0].filter((index) => days[index] === '1');
  if (selected.length === 7) {
    return 'Todos los días';
  }
  if (days === WEEKDAYS) {
    return 'Lun a vie';
  }
  if (days === WEEKEND) {
    return 'Fines de semana';
  }
  if (selected.length === 1) {
    return DAY_NAMES[selected[0]];
  }
  return selected.map((index) => DAY_SHORT[index]).join(', ');
};

export const formatTime = (date) => {
  const value = new Date(date);
  const {clock, period} = toTwelveHour(value.getHours(), value.getMinutes());
  return `${clock} ${period}`;
};

export const formatClock = (text) => {
  if (!text) {
    return '';
  }
  const [hours, minutes] = text.split(':').map(Number);
  const {clock, period} = toTwelveHour(hours, minutes);
  return `${clock} ${period}`;
};

export const normalizeText = (text) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export const countText = (count, singular, plural) => {
  if (count === 1) {
    return `1 ${singular}`;
  }
  return `${count} ${plural}`;
};

export const parseDecimal = (text) => {
  const clean = String(text ?? '').trim().replace(',', '.');
  if (!clean) {
    return Number.NaN;
  }
  return Number(clean);
};

export const formatHours = (start, end) => {
  if (!start || !end) {
    return '';
  }
  return `${formatClock(start)} a ${formatClock(end)}`;
};

export const formatDayMonthYear = (iso) => {
  if (!iso) {
    return '';
  }
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
};

const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

export const formatWait = (minutes) => {
  if (minutes < MINUTES_PER_HOUR) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  if (hours < HOURS_PER_DAY) {
    const rest = minutes % MINUTES_PER_HOUR;
    if (rest === 0) {
      return `${hours} h`;
    }
    return `${hours} h ${rest} min`;
  }
  const days = Math.floor(hours / HOURS_PER_DAY);
  const restHours = hours % HOURS_PER_DAY;
  if (restHours === 0) {
    return `${days} d`;
  }
  return `${days} d ${restHours} h`;
};
