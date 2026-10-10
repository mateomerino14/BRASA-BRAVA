import {ArrowDownUp, Ban, History, Pencil, RotateCcw} from 'lucide-react';
import {ListTable} from '../../../components/organisms/ListTable';
import {Badge} from '../../../components/atoms/Badge';
import {IconButton} from '../../../components/atoms/IconButton';
import {LevelBar} from '../../../components/atoms/LevelBar';
import {cn} from '../../../lib/cn';
import {formatQuantity} from '../../../lib/format';
import {QuantityAmount} from './QuantityAmount';
import {LEVEL_META} from '../constants/stock';

const styles = {
  name: 'truncate font-semibold text-carbon',
  inactiveName: 'text-cafe line-through',
  unit: 'text-xs text-cafe',
  stock: 'flex min-w-36 flex-col gap-1.5',
  minimum: 'whitespace-nowrap text-sm text-cafe',
  actions: 'inline-flex gap-2',
  inactiveRow: 'bg-hueso/40',
};

const UNIT_NAMES = {kg: 'Kilogramos', g: 'Gramos', l: 'Litros', ml: 'Mililitros', unidad: 'Unidades'};

const buildColumns = ({onEdit, onToggleStatus, onMove, onHistory}) => [
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
    key: 'stock',
    header: 'Stock actual',
    sortKey: 'stock',
    render: (ingredient) => (
      <div className={styles.stock}>
        <QuantityAmount value={ingredient.stockActual} unit={ingredient.unidad} />
        <LevelBar value={ingredient.stockActual} minimum={ingredient.stockMinimo} tone={LEVEL_META[ingredient.nivel].tone} />
      </div>
    ),
  },
  {key: 'minimo', header: 'Mínimo', align: 'center', render: (ingredient) => <span className={styles.minimum}>{formatQuantity(ingredient.stockMinimo, ingredient.unidad)}</span>},
  {
    key: 'nivel',
    header: 'Nivel',
    align: 'center',
    render: (ingredient) => <Badge dot tone={LEVEL_META[ingredient.nivel].tone}>{LEVEL_META[ingredient.nivel].label}</Badge>,
  },
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
        <IconButton icon={ArrowDownUp} tone="edit" label={`Registrar movimiento de ${ingredient.nombre}`} disabled={!ingredient.activo} onClick={() => onMove(ingredient)} />
        <IconButton icon={History} tone="neutral" label={`Ver historial de ${ingredient.nombre}`} onClick={() => onHistory(ingredient)} />
        <IconButton icon={Pencil} tone="neutral" label={`Modificar ${ingredient.nombre}`} onClick={() => onEdit(ingredient)} />
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

export function IngredientsTable({list, onEdit, onToggleStatus, onMove, onHistory}) {
  return (
    <ListTable
      list={list}
      caption="Insumos"
      itemLabel="insumos"
      columns={buildColumns({onEdit, onToggleStatus, onMove, onHistory})}
      emptyMessage="No se encontraron insumos con esos filtros"
      rowClassName={(ingredient) => !ingredient.activo && styles.inactiveRow}
    />
  );
}
