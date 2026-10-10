// Fecha de hoy (YYYY-MM-DD) y día de la semana (0 = domingo) en la zona horaria del local
export const localToday = (now, timeZone) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {timeZone, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short'})
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return {date: `${parts.year}-${parts.month}-${parts.day}`, weekday: weekdays.indexOf(parts.weekday)};
};

// Normaliza una fecha de la base (texto en PostgreSQL, Date en pg-mem) a YYYY-MM-DD
export const toIsoDate = (value) => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).slice(0, 10);
};

const DAY_MS = 24 * 60 * 60 * 1000;

// Diferencia en ms entre la hora local de una zona y UTC en un instante dado
const zoneOffset = (instant, timeZone) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'})
      .formatToParts(instant)
      .map((part) => [part.type, part.value]),
  );
  const asUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
  return asUtc - instant.getTime();
};

// Instante UTC en que empieza un día de calendario YYYY-MM-DD en la zona del local
const localMidnight = (isoDate, timeZone) => {
  const midnightUtc = Date.parse(`${isoDate}T00:00:00Z`);
  return new Date(midnightUtc - zoneOffset(new Date(midnightUtc), timeZone));
};

// Inicio y fin (UTC) de un día de calendario en la zona del local; el fin es el inicio del día siguiente
export const localDayRange = (isoDate, timeZone) => {
  const nextDate = new Date(Date.parse(`${isoDate}T00:00:00Z`) + DAY_MS).toISOString().slice(0, 10);
  return {start: localMidnight(isoDate, timeZone), end: localMidnight(nextDate, timeZone)};
};
