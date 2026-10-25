export const CONFIRMATION_WORD = 'ELIMINAR';

export const DELETION_TYPES = ['empleados', 'cargos', 'secciones', 'productos', 'categorias', 'insumos', 'promociones', 'ventas'];

export const TYPE_LABELS = {
  empleados: 'Empleados',
  cargos: 'Cargos',
  secciones: 'Secciones y mesas',
  productos: 'Productos',
  categorias: 'Categorías',
  insumos: 'Insumos',
  promociones: 'Promociones',
  ventas: 'Ventas',
};

// Texto de la pestaña cuando no hay nada para eliminar
export const EMPTY_TEXT = {
  empleados: 'No hay empleados dados de baja.',
  cargos: 'No hay cargos dados de baja.',
  secciones: 'No hay secciones dadas de baja.',
  productos: 'No hay productos dados de baja.',
  categorias: 'No hay categorías dadas de baja.',
  insumos: 'No hay insumos dados de baja.',
  promociones: 'No hay promociones dadas de baja.',
  ventas: 'No hay ventas cobradas en esas fechas.',
};

export const emptySelection = () => Object.fromEntries(DELETION_TYPES.map((tipo) => [tipo, []]));
