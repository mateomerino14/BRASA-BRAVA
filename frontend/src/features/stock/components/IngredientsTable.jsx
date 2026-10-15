import {Ban, Pencil, RotateCcw} from 'lucide-react';
import {ListTable} from '../../../components/organisms/ListTable';
import {Badge} from '../../../components/atoms/Badge';
import {IconButton} from '../../../components/atoms/IconButton';
import {cn} from '../../../lib/cn';
import {formatQuantity} from '../../../lib/format';
import {QuantityAmount} from './QuantityAmount';
import {LEVEL_TONES, UNIT_NAMES} from '../constants/stock';

const styles = {
  name: 'truncate font-semibold text-carbon',
  inactiveName: 'text-cafe line-through',
  unit: 'text-xs text-cafe',
  minimum: 'whitespace-nowrap text-sm text-cafe',
  actions: 'inline-flex gap-2',
  inactiveRow: 'bg-hueso/40',
};

const buildColumns = ({onEdit, onToggleStatus}) => [
  {
    key: 'insumo',
    header: 'Insumo',
    sortKey: 'nombre',
    mobile: 'title',
    render: (ingredient) => (
      <div>
        <p className={cn(styles.name, !ingredient.activo && styles.inactiveName)}>{ingredient.nombre}</p>
        <p className={styles.unit}>{UNIT_NAMES[ingredient.unidad]}</p>
      </div>
    ),
  },
  {
    key: 'cantidad',
    header: 'Cantidad',
    sortKey: 'stock',
    render: (ingredient) => <QuantityAmount value={ingredient.stockActual} unit={ingredient.unidad} valueClassName={LEVEL_TONES[ingredient.nivel]} />,
  },
  {key: 'minimo', header: 'Mínimo', render: (ingredient) => <span className={styles.minimum}>{formatQuantity(ingredient.stockMinimo, ingredient.unidad)}</span>},
  {
    key: 'estado',
    header: 'Estado',
    sortKey: 'estado',
    align: 'center',
    render: (ingredient) => (
      <Badge tone={ingredient.activo ? 'neutral' : 'danger'}>
        {ingredient.activo ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
  },
  {
    key: 'acciones',
    header: 'Acciones',
    align: 'center',
    mobile: 'actions',
    render: (ingredient) => (
      <span className={styles.actions}>
        <IconButton icon={Pencil} tone="edit" label={`Modificar ${ingredient.nombre}`} onClick={() => onEdit(ingredient)} />
        <IconButton
          icon={ingredient.activo ? Ban : RotateCcw}
          tone={ingredient.activo ? 'danger' : 'success'}
          label={`${ingredient.activo ? 'Dar de baja' : 'Reactivar'} ${ingredient.nombre}`}
          onClick={() => onToggleStatus(ingredient)}
        />
      </span>
    ),
  },
];

export function IngredientsTable({list, onEdit, onToggleStatus}) {
  return (
    <ListTable
      list={list}
      caption="Insumos"
      itemLabel="insumos"
      columns={buildColumns({onEdit, onToggleStatus})}
      emptyMessage="No se encontraron insumos con esos filtros"
      rowClassName={(ingredient) => !ingredient.activo && styles.inactiveRow}
    />
  );
}
