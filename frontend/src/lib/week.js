export const ALL_DAYS = '1111111';
export const WEEKDAYS = '0111110';
export const WEEKEND = '1000001';
export const WEEKDAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const selectedDays = (days) => WEEK_ORDER.filter((index) => days[index] === '1');
