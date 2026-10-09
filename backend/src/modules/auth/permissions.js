// Pantallas del sistema; el DIRECTORIO tiene todas y los cargos reciben un subconjunto
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
]);

// Normaliza los permisos de un cargo: solo pantallas válidas y siempre incluye home
export const normalizePermissions = (screens) =>
  SCREENS.filter((screen) => screen === 'home' || screens.includes(screen));
