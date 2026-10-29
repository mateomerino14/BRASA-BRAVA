// Pantallas del sistema que se asignan a los cargos; "administracion" es el permiso del enlace de impuestos en Caja
export const SCREENS = Object.freeze([
  'home',
  'familia',
  'caja',
  'administracion',
  'productos',
  'secciones',
  'stock',
  'categorias',
  'promociones',
  'empleados',
  'cargos',
  'reportes',
  'eliminacion',
]);

// Pantallas que se marcan en un cargo: home lo tienen todos y la eliminación física es solo del DIRECTORIO
export const ASSIGNABLE_SCREENS = Object.freeze(SCREENS.filter((screen) => screen !== 'home' && screen !== 'eliminacion'));

// Normaliza los permisos de un cargo e incluye siempre home
export const normalizePermissions = (screens) =>
  SCREENS.filter((screen) => screen === 'home' || screens.includes(screen));
