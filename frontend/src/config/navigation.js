import {
  Boxes,
  ChefHat,
  Database,
  FolderTree,
  House,
  LayoutGrid,
  Package,
  Percent,
  Settings,
  ShoppingCart,
  UsersRound,
} from 'lucide-react';

// Menú del sidebar. "permission" coincide con las pantallas que devuelve el backend.
export const NAVIGATION = [
  {label: 'Home', title: 'Página principal', to: '/', icon: House, permission: 'home', end: true},
  {label: 'Familia', title: 'Familia', to: '/familia', icon: Boxes, permission: 'familia'},
  {label: 'Caja', title: 'Caja', to: '/caja', icon: ShoppingCart, permission: 'caja'},
  {label: 'Cocina', title: 'Pedidos pendientes', to: '/cocina', icon: ChefHat, permission: 'cocina'},
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
        label: 'Stock',
        title: 'Gestión de stock',
        to: '/stock',
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
