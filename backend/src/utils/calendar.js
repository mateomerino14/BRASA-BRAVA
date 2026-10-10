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
