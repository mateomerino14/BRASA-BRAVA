export const REPORT_TYPES = [
  {value: 'resumen', label: 'Resumen de ventas'},
  {value: 'detalle', label: 'Ventas detalladas'},
];

export const REPORT_TITLES = {resumen: 'Resumen de ventas', detalle: 'Ventas detalladas'};

export const ALL_EMPLOYEES = 'todos';

export const DIRECTORIO_FILTER = 'directorio';

export const EMPTY_SCHEDULE = {correo: '', tipo: 'resumen', dias: '0100100', hora: '08:00'};

export const MAIL_NOT_CONFIGURED_TITLE = 'Correo no configurado';
export const MAIL_NOT_CONFIGURED = 'Este sistema todavía no tiene configurado el servicio de correo (Brevo): el reporte no le llega a nadie. Pida al encargado del sistema que lo configure.';
