import {localDayRange, localToday} from '../../utils/calendar.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_DAYS = 7;
const MINUTE_MS = 60000;
const MINUTES_PER_HOUR = 60;

// Fecha local que queda "days" días antes de una fecha YYYY-MM-DD
const shiftDate = (isoDate, days) => new Date(Date.parse(`${isoDate}T00:00:00Z`) - days * DAY_MS).toISOString().slice(0, 10);

// Instante UTC de una fecha local a la hora "HH:MM"
const slotAt = (isoDate, hora, timeZone) => {
  const [hours, minutes] = hora.split(':').map(Number);
  return new Date(localDayRange(isoDate, timeZone).start.getTime() + (hours * MINUTES_PER_HOUR + minutes) * MINUTE_MS);
};

// Último turno programado (día marcado a su hora) que ya llegó en "now"; null si no hay ninguno en la última semana
export const lastDueSlot = ({dias, hora}, now, timeZone) => {
  const today = localToday(now, timeZone);
  for (let back = 0; back <= WEEK_DAYS; back += 1) {
    const weekday = (today.weekday - back + WEEK_DAYS * 2) % WEEK_DAYS;
    if (dias[weekday] !== '1') {
      continue;
    }
    const slot = slotAt(shiftDate(today.date, back), hora, timeZone);
    if (slot.getTime() <= now.getTime()) {
      return slot;
    }
  }
  return null;
};

// Próximo turno programado después de "now"
export const nextSlot = ({dias, hora}, now, timeZone) => {
  const today = localToday(now, timeZone);
  for (let ahead = 0; ahead <= WEEK_DAYS; ahead += 1) {
    const weekday = (today.weekday + ahead) % WEEK_DAYS;
    if (dias[weekday] !== '1') {
      continue;
    }
    const slot = slotAt(shiftDate(today.date, -ahead), hora, timeZone);
    if (slot.getTime() > now.getTime()) {
      return slot;
    }
  }
  return null;
};
