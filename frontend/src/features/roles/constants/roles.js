import {Boxes, Database, FileChartColumn, FolderTree, Link2, LayoutGrid, Package, Percent, ShieldCheck, ShoppingCart, UsersRound} from 'lucide-react';

export {STATUS_OPTIONS} from '../../../config/lists';

export const NAME_MAX_LENGTH = 40;
export const VISIBLE_SCREENS = 3;

export const EMPTY_FORM = {nombre: '', pantallas: []};

export const SCREEN_GROUPS = [
  {
    title: 'Operación del local',
    screens: [
      {id: 'familia', label: 'Familia', hint: 'Consultar productos, recetas y stock', icon: Boxes},
      {id: 'caja', label: 'Caja', hint: 'Mesas, pedidos, cocina, cobro y autorizar reimpresiones', icon: ShoppingCart},
      {id: 'reportes', label: 'Reportes', hint: 'Ventas por fechas, en PDF o por correo', icon: FileChartColumn},
    ],
  },
  {
    title: 'Administración',
    screens: [
      {id: 'productos', label: 'Productos', hint: 'Productos, precios y recetas', icon: Package},
      {id: 'secciones', label: 'Secciones', hint: 'Ambientes y mesas del local', icon: LayoutGrid},
      {id: 'stock', label: 'Inventario', hint: 'Insumos y cantidades', icon: Database},
      {id: 'categorias', label: 'Categorías', hint: 'Categorías y subcategorías', icon: FolderTree},
      {id: 'promociones', label: 'Promociones', hint: 'Combos y sus días', icon: Percent},
      {id: 'empleados', label: 'Empleados', hint: 'Registrar empleados y darles acceso', icon: UsersRound},
      {id: 'cargos', label: 'Cargos', hint: 'Esta pantalla: cargos y permisos', icon: ShieldCheck},
      {id: 'administracion', label: 'Enlace de impuestos', hint: 'Cambiar el enlace de impuestos en Caja', icon: Link2},
    ],
  },
];

export const ALL_SCREENS = SCREEN_GROUPS.flatMap((group) => group.screens);

export const SCREEN_LABELS = Object.fromEntries(ALL_SCREENS.map((screen) => [screen.id, screen.label]));
