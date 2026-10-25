import {localDayRange, localToday} from '../../utils/calendar.js';

const moneyFormatter = new Intl.NumberFormat('es-BO', {minimumFractionDigits: 2, maximumFractionDigits: 2});
const WEEKDAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Monto como lo lee el local: 1120.5 → "1.120,50"
export const money = (value) => moneyFormatter.format(value);

// Fecha YYYY-MM-DD como día/mes/año
export const dayMonthYear = (isoDate) => {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
};

// Fecha local (YYYY-MM-DD) de un instante
export const localDate = (instant, timeZone) => localToday(new Date(instant), timeZone).date;

// Día local con su nombre corto: "Lun 20/10/2026"
export const weekdayDate = (isoDate, timeZone) => {
  const {weekday} = localToday(new Date(localDayRange(isoDate, timeZone).start.getTime() + 1), timeZone);
  return `${WEEKDAY_SHORT[weekday]} ${dayMonthYear(isoDate)}`;
};

// Hora local de un instante en 12 horas: "8:05 PM"
export const clock = (instant, timeZone) => new Intl.DateTimeFormat('en-US', {timeZone, hour: 'numeric', minute: '2-digit', hour12: true}).format(new Date(instant));

// Fecha y hora local: "21/10/2026 8:05 PM"
export const dateTime = (instant, timeZone) => `${dayMonthYear(localDate(instant, timeZone))} ${clock(instant, timeZone)}`;
