import {
  Boxes,
  Database,
  FileChartColumn,
  FolderTree,
  House,
  LayoutGrid,
  Package,
  Percent,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  UsersRound,
} from 'lucide-react';

export const NAVIGATION = [
  {label: 'Home', title: 'Página principal', to: '/', icon: House, permission: 'home', end: true},
  {label: 'Familia', title: 'Familia', to: '/familia', icon: Boxes, permission: 'familia'},
  {label: 'Caja', title: 'Caja', to: '/caja', icon: ShoppingCart, permission: 'caja'},
  {label: 'Reportes', title: 'Reportes de ventas', to: '/reportes', icon: FileChartColumn, permission: 'reportes'},
  {
    label: 'Administración',
    icon: Settings,
    permission: 'administracion',
    children: [
      {
        label: 'Productos',
        title: 'Gestión de productos',
        to: '/productos',
        icon: Package,
        permission: 'productos',
      },
      {
        label: 'Secciones',
        title: 'Gestión de secciones y mesas',
        to: '/secciones',
        icon: LayoutGrid,
        permission: 'secciones',
      },
      {
        label: 'Inventario',
        title: 'Inventario de insumos',
        to: '/inventario',
        icon: Database,
        permission: 'stock',
      },
      {
        label: 'Categorías',
        title: 'Gestión de categorías',
        to: '/categorias',
        icon: FolderTree,
        permission: 'categorias',
      },
      {
        label: 'Promociones',
        title: 'Gestión de promociones',
        to: '/promociones',
        icon: Percent,
        permission: 'promociones',
      },
      {
        label: 'Empleados',
        title: 'Gestión de empleados',
        to: '/empleados',
        icon: UsersRound,
        permission: 'empleados',
      },
      {
        label: 'Cargos',
        title: 'Gestión de cargos',
        to: '/cargos',
        icon: ShieldCheck,
        permission: 'cargos',
      },
      {
        label: 'Eliminación física',
        title: 'Eliminación física',
        to: '/eliminacion',
        icon: Trash2,
        permission: 'eliminacion',
      },
    ],
  },
];

export const filterNavigation = (items, permissions = []) => items.flatMap((item) => {
  if (item.children) {
    const children = filterNavigation(item.children, permissions);
    if (children.length === 0) {
      return [];
    }
    return [{...item, children}];
  }
  if (permissions.includes(item.permission)) {
    return [item];
  }
  return [];
});

export const flattenNavigation = (items) => items.flatMap((item) => {
  if (item.children) {
    return flattenNavigation(item.children);
  }
  return [item];
});
