export const REPORT_TYPES = [
  {value: 'resumen', label: 'Resumen de ventas'},
  {value: 'detalle', label: 'Ventas detalladas'},
];

export const REPORT_TITLES = {resumen: 'Resumen de ventas', detalle: 'Ventas detalladas'};

export const ALL_EMPLOYEES = 'todos';

export const DIRECTORIO_FILTER = 'directorio';

export const CONSUMO_LABELS = {local: 'Local', llevar: 'Para llevar'};

// Días de la semana para el texto de un envío programado, en el orden del texto de 7 dígitos (domingo primero)
export const WEEKDAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export const EMPTY_SCHEDULE = {correo: '', tipo: 'resumen', dias: '0100100', hora: '08:00'};
