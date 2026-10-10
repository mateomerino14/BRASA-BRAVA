import {Ban, Pencil, RotateCcw} from 'lucide-react';
import {DataTable} from '../../../components/organisms/DataTable';
import {Pagination} from '../../../components/molecules/Pagination';
import {Thumbnail} from '../../../components/atoms/Thumbnail';
import {Badge} from '../../../components/atoms/Badge';
import {IconButton} from '../../../components/atoms/IconButton';
import {cn} from '../../../lib/cn';
import {SubcategoryChips} from './SubcategoryChips';

const styles = {
  category: 'flex min-w-0 items-center gap-3',
  categoryText: 'min-w-0',
  name: 'truncate font-semibold text-carbon',
  inactiveName: 'text-cafe line-through',
  description: 'truncate text-xs text-cafe lg:max-w-64',
  count: 'font-display text-2xl text-carbon',
  actions: 'inline-flex gap-2',
  inactiveRow: 'bg-hueso/40',
};

const buildColumns = ({onEdit, onToggleStatus}) => [
  {
    key: 'categoria',
    header: 'Categoría',
    mobile: 'title',
    render: (category) => (
      <div className={styles.category}>
        <Thumbnail src={category.imagenUrl} alt={category.nombre} size={52} muted={!category.activa} />
        <div className={styles.categoryText}>
          <p className={cn(styles.name, !category.activa && styles.inactiveName)}>{category.nombre}</p>
          {category.descripcion && <p className={styles.description} title={category.descripcion}>{category.descripcion}</p>}
        </div>
      </div>
    ),
  },
  {
    key: 'subcategorias',
    header: 'Subcategorías',
    wide: true,
    render: (category) => <SubcategoryChips categoryName={category.nombre} subcategories={category.subcategorias} />,
  },
  {key: 'productos', header: 'Productos', align: 'center', render: (category) => <span className={styles.count}>{category.totalProductos}</span>},
  {
    key: 'estado',
    header: 'Estado',
    align: 'center',
    render: (category) => (
      <Badge dot tone={category.activa ? 'success' : 'danger'}>
        {category.activa ? 'Activa' : 'Inactiva'}
      </Badge>
    ),
  },
  {
    key: 'acciones',
    header: 'Acciones',
    mobile: 'actions',
    align: 'center',
    render: (category) => (
      <span className={styles.actions}>
        <IconButton icon={Pencil} tone={category.activa ? 'edit' : 'neutral'} label={`Modificar ${category.nombre}`} onClick={() => onEdit(category)} />
        <IconButton
          icon={category.activa ? Ban : RotateCcw}
          tone={category.activa ? 'danger' : 'success'}
          label={`${category.activa ? 'Dar de baja' : 'Reactivar'} ${category.nombre}`}
          onClick={() => onToggleStatus(category)}
        />
      </span>
    ),
  },
];

const rangeText = ({page, pageSize, count, total}) => {
  if (total === 0) {
    return 'Sin resultados';
  }
  const from = (page - 1) * pageSize + 1;
  return `Mostrando ${from}–${from + count - 1} de ${total} categorías`;
};

export function CategoriesTable({categories, total, page, pageSize, totalPages, loading, onPageChange, onEdit, onToggleStatus}) {
  return (
    <DataTable
      caption="Categorías"
      columns={buildColumns({onEdit, onToggleStatus})}
      rows={categories}
      rowKey={(category) => category.id}
      loading={loading}
      emptyMessage="No se encontraron categorías con esos filtros"
      rowClassName={(category) => !category.activa && styles.inactiveRow}
      footer={
        <>
          <span>{rangeText({page, pageSize, count: categories.length, total})}</span>
          <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
        </>
      }
    />
  );
}
