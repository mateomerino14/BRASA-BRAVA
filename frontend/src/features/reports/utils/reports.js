import {WEEKDAY_NAMES} from '../constants/reports';

const pad = (value) => String(value).padStart(2, '0');
const DAYS_IN_WEEK = 7;

export const isoDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const periodShortcuts = (today = new Date()) => {
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const sinceMonday = (today.getDay() + DAYS_IN_WEEK - 1) % DAYS_IN_WEEK;
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - sinceMonday);
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  return [
    {label: 'Hoy', desde: isoDate(today), hasta: isoDate(today)},
    {label: 'Ayer', desde: isoDate(yesterday), hasta: isoDate(yesterday)},
    {label: 'Esta semana', desde: isoDate(monday), hasta: isoDate(today)},
    {label: 'Este mes', desde: isoDate(firstOfMonth), hasta: isoDate(today)},
  ];
};

export const daysText = (dias) => {
  if (dias === '1111111') {
    return 'Todos los días';
  }
  const order = [1, 2, 3, 4, 5, 6, 0].filter((index) => dias[index] === '1').map((index) => WEEKDAY_NAMES[index]);
  if (order.length === 1) {
    return order[0][0].toUpperCase() + order[0].slice(1);
  }
  const text = `${order.slice(0, -1).join(', ')} y ${order.at(-1)}`;
  return text[0].toUpperCase() + text.slice(1);
};

export const reportQuery = ({desde, hasta, empleado, tipo}) => new URLSearchParams({desde, hasta, empleado, tipo}).toString();
