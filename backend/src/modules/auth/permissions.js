// Pantallas del sistema que se asignan a los cargos
export const SCREENS = Object.freeze([
  'home',
  'familia',
  'caja',
  'cocina',
  'administracion',
  'productos',
  'secciones',
  'stock',
  'categorias',
  'promociones',
  'empleados',
]);

// Normaliza los permisos de un cargo e incluye siempre home
export const normalizePermissions = (screens) =>
  SCREENS.filter((screen) => screen === 'home' || screens.includes(screen));
