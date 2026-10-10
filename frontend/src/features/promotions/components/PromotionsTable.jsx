import {Ban, Pencil, RotateCcw} from 'lucide-react';
import {ListTable} from '../../../components/organisms/ListTable';
import {ChipList} from '../../../components/molecules/ChipList';
import {PriceTag} from '../../../components/molecules/PriceTag';
import {Thumbnail} from '../../../components/atoms/Thumbnail';
import {Badge} from '../../../components/atoms/Badge';
import {IconButton} from '../../../components/atoms/IconButton';
import {cn} from '../../../lib/cn';
import {formatDate, formatDays} from '../../../lib/format';
import {VIGENCIA_META} from '../constants/promotions';

const styles = {
  promotion: 'flex min-w-0 items-center gap-3',
  text: 'flex min-w-0 flex-col items-start gap-1',
  name: 'truncate font-semibold text-carbon',
  inactiveName: 'text-cafe line-through',
  vigencia: 'flex flex-col items-start gap-1',
  dates: 'whitespace-nowrap text-sm text-carbon',
  days: 'text-xs text-cafe',
  actions: 'inline-flex gap-2',
  inactiveRow: 'bg-hueso/40',
};

// "13 oct 2026 – 12 nov 2026" o "Desde 13 oct 2026"
const dateRange = (promotion) => {
  if (promotion.fechaFin) {
    return `${formatDate(promotion.fechaInicio)} – ${formatDate(promotion.fechaFin)}`;
  }
  return `Desde ${formatDate(promotion.fechaInicio)}`;
};

const typeLabel = (promotion) => {
  if (promotion.tipo === 'descuento') {
    return `−${promotion.valor}%`;
  }
  return 'Combo';
};

const productChips = (promotion) => promotion.productos.map((item) => ({id: item.idProducto, label: `${item.cantidad}× ${item.nombre}`}));

const buildColumns = ({onEdit, onToggleStatus}) => [
  {
    key: 'promocion',
    header: 'Promoción',
    sortKey: 'nombre',
    mobile: 'title',
    render: (promotion) => (
      <div className={styles.promotion}>
        <Thumbnail src={promotion.imagenUrl} alt={promotion.nombre} size={52} muted={!promotion.activa} />
        <div className={styles.text}>
          <p className={cn(styles.name, !promotion.activa && styles.inactiveName)}>{promotion.nombre}</p>
          <Badge tone="brand">{typeLabel(promotion)}</Badge>
        </div>
      </div>
    ),
  },
  {key: 'productos', header: 'Productos', wide: true, render: (promotion) => <ChipList label={`Productos de ${promotion.nombre}`} items={productChips(promotion)} visible={2} />},
  {key: 'precio', header: 'Precio', align: 'right', render: (promotion) => <PriceTag regular={promotion.precioRegular} promo={promotion.precioPromocion} />},
  {
    key: 'vigencia',
    header: 'Vigencia',
    sortKey: 'inicio',
    render: (promotion) => (
      <div className={styles.vigencia}>
        <Badge dot tone={VIGENCIA_META[promotion.vigencia].tone}>{VIGENCIA_META[promotion.vigencia].label}</Badge>
        <span className={styles.dates}>{dateRange(promotion)}</span>
        <span className={styles.days}>{formatDays(promotion.dias)}</span>
      </div>
    ),
  },
  {
    key: 'acciones',
    header: 'Acciones',
    align: 'center',
    mobile: 'actions',
    render: (promotion) => (
      <span className={styles.actions}>
        <IconButton icon={Pencil} tone={promotion.activa ? 'edit' : 'neutral'} label={`Modificar ${promotion.nombre}`} onClick={() => onEdit(promotion)} />
        <IconButton
          icon={promotion.activa ? Ban : RotateCcw}
          tone={promotion.activa ? 'danger' : 'success'}
          label={`${promotion.activa ? 'Dar de baja' : 'Reactivar'} ${promotion.nombre}`}
          onClick={() => onToggleStatus(promotion)}
        />
      </span>
    ),
  },
];

export function PromotionsTable({list, onEdit, onToggleStatus}) {
  return (
    <ListTable
      list={list}
      caption="Promociones"
      itemLabel="promociones"
      columns={buildColumns({onEdit, onToggleStatus})}
      emptyMessage="No se encontraron promociones con esos filtros"
      rowClassName={(promotion) => !promotion.activa && styles.inactiveRow}
    />
  );
}
