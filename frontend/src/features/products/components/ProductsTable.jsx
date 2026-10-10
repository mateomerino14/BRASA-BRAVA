import {Ban, ChefHat, Pencil, RotateCcw} from 'lucide-react';
import {ListTable} from '../../../components/organisms/ListTable';
import {Thumbnail} from '../../../components/atoms/Thumbnail';
import {Badge} from '../../../components/atoms/Badge';
import {IconButton} from '../../../components/atoms/IconButton';
import {Switch} from '../../../components/atoms/Switch';
import {Amount} from '../../../components/atoms/Amount';
import {cn} from '../../../lib/cn';
import {formatAmount} from '../../../lib/format';

// Desde cuántas porciones o menos se avisa que queda poco
const LOW_PORTIONS = 5;

const styles = {
  product: 'flex min-w-0 items-center gap-3',
  productText: 'min-w-0',
  name: 'truncate font-semibold text-carbon',
  inactiveName: 'text-cafe line-through',
  description: 'truncate text-xs text-cafe lg:max-w-56',
  category: 'flex flex-col items-start gap-1',
  categoryName: 'text-sm font-semibold text-carbon',
  subcategory: 'whitespace-nowrap rounded-full border border-arena/70 bg-hueso px-2.5 py-0.5 text-xs font-semibold text-carbon',
  warning: 'text-xs font-semibold text-rojo',
  actions: 'inline-flex gap-2',
  noRecipe: 'text-xs font-semibold text-cafe',
  inactiveRow: 'bg-hueso/40',
};

// Aviso cuando la categoría o subcategoría del producto se dio de baja (no aparecerá en caja)
const hiddenReason = (product) => {
  if (!product.categoria.activa) {
    return 'Categoría de baja';
  }
  if (!product.subcategoria.activa) {
    return 'Subcategoría de baja';
  }
  return '';
};

// Porciones que alcanzan según la receta y el stock
function PortionsBadge({portions}) {
  if (portions === null) {
    return <span className={styles.noRecipe}>Sin receta</span>;
  }
  if (portions === 0) {
    return <Badge dot tone="danger">Sin insumos</Badge>;
  }
  let tone = 'success';
  if (portions <= LOW_PORTIONS) {
    tone = 'warning';
  }
  return <Badge dot tone={tone}>{portions} porciones</Badge>;
}

const buildColumns = ({onEdit, onToggleStatus, onRecipe, availability}) => [
  {
    key: 'producto',
    header: 'Producto',
    sortKey: 'nombre',
    mobile: 'title',
    render: (product) => (
      <div className={styles.product}>
        <Thumbnail src={product.imagenUrl} alt={product.nombre} size={52} muted={!product.activo} />
        <div className={styles.productText}>
          <p className={cn(styles.name, !product.activo && styles.inactiveName)}>{product.nombre}</p>
          {product.descripcion && <p className={styles.description} title={product.descripcion}>{product.descripcion}</p>}
        </div>
      </div>
    ),
  },
  {
    key: 'categoria',
    header: 'Categoría',
    sortKey: 'categoria',
    render: (product) => (
      <div className={styles.category}>
        <span className={styles.categoryName}>{product.categoria.nombre}</span>
        <span className={styles.subcategory}>{product.subcategoria.nombre}</span>
        {hiddenReason(product) && <span className={styles.warning}>{hiddenReason(product)}</span>}
      </div>
    ),
  },
  {
    key: 'precio',
    header: 'Precio',
    sortKey: 'precio',
    align: 'right',
    render: (product) => (
      <Amount prefix="Bs" value={formatAmount(product.precio)} />
    ),
  },
  {
    key: 'disponible',
    header: 'Disponible',
    align: 'center',
    render: (product) => (
      <Switch
        label={`${product.nombre} disponible`}
        checked={product.disponible}
        disabled={!product.activo || availability.isPending(product)}
        onChange={() => availability.toggle(product)}
      />
    ),
  },
  {key: 'receta', header: 'Receta', align: 'center', render: (product) => <PortionsBadge portions={product.porciones} />},
  {
    key: 'estado',
    header: 'Estado',
    sortKey: 'estado',
    align: 'center',
    render: (product) => (
      <Badge dot tone={product.activo ? 'success' : 'danger'}>
        {product.activo ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
  },
  {
    key: 'acciones',
    header: 'Acciones',
    align: 'center',
    mobile: 'actions',
    render: (product) => (
      <span className={styles.actions}>
        <IconButton icon={ChefHat} tone="neutral" label={`Receta de ${product.nombre}`} onClick={() => onRecipe(product)} />
        <IconButton icon={Pencil} tone={product.activo ? 'edit' : 'neutral'} label={`Modificar ${product.nombre}`} onClick={() => onEdit(product)} />
        <IconButton
          icon={product.activo ? Ban : RotateCcw}
          tone={product.activo ? 'danger' : 'success'}
          label={`${product.activo ? 'Dar de baja' : 'Reactivar'} ${product.nombre}`}
          onClick={() => onToggleStatus(product)}
        />
      </span>
    ),
  },
];

export function ProductsTable({list, onEdit, onToggleStatus, onRecipe, availability}) {
  return (
    <ListTable
      list={list}
      caption="Productos"
      itemLabel="productos"
      columns={buildColumns({onEdit, onToggleStatus, onRecipe, availability})}
      emptyMessage="No se encontraron productos con esos filtros"
      rowClassName={(product) => !product.activo && styles.inactiveRow}
    />
  );
}
