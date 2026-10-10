import {Modal} from '../../../components/organisms/Modal';
import {Pagination} from '../../../components/molecules/Pagination';
import {Alert} from '../../../components/molecules/Alert';
import {Badge} from '../../../components/atoms/Badge';
import {Spinner} from '../../../components/atoms/Spinner';
import {formatQuantity} from '../../../lib/format';
import {MOVEMENT_LABELS} from '../constants/stock';
import {QuantityAmount} from './QuantityAmount';

const styles = {
  list: 'flex flex-col divide-y divide-arena/40 rounded-2xl border border-arena/60 bg-white',
  item: 'grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3',
  top: 'flex items-center gap-2',
  reason: 'truncate text-sm text-carbon',
  meta: 'text-xs text-cafe',
  quantity: 'text-right',
  positive: 'text-verde',
  negative: 'text-rojo',
  result: 'text-right text-xs text-cafe',
  empty: 'py-10 text-center text-sm text-cafe',
  loading: 'flex justify-center py-10',
  footer: 'mt-4 flex items-center justify-between text-xs text-cafe',
};

const TYPE_TONES = {entrada: 'success', salida: 'danger', ajuste: 'warning', venta: 'brand'};

const dateFormatter = new Intl.DateTimeFormat('es-BO', {day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'});

function HistoryBody({history}) {
  const unit = history.target.unidad;
  if (history.loading && history.items.length === 0) {
    return <div className={styles.loading}><Spinner size={28} label="Cargando historial" /></div>;
  }
  if (history.items.length === 0) {
    return <p className={styles.empty}>Este insumo todavía no tiene movimientos.</p>;
  }
  return (
    <ul aria-label={`Historial de ${history.target.nombre}`} className={styles.list}>
      {history.items.map((item) => (
        <li key={item.id} className={styles.item}>
          <div className={styles.top}>
            <Badge tone={TYPE_TONES[item.tipo]}>{MOVEMENT_LABELS[item.tipo]}</Badge>
            <span className={styles.reason}>{item.motivo ?? 'Sin motivo'}</span>
          </div>
          <span className={styles.quantity}>
            <QuantityAmount value={item.cantidad} unit={unit} sign valueClassName={item.cantidad < 0 ? styles.negative : styles.positive} />
          </span>
          <span className={styles.meta}>{dateFormatter.format(new Date(item.fecha))} · {item.responsable}</span>
          <span className={styles.result}>Quedó {formatQuantity(item.stockResultante, unit)}</span>
        </li>
      ))}
    </ul>
  );
}

export function HistoryModal({history}) {
  return (
    <Modal open={Boolean(history.target)} onClose={history.close} size="lg" title="Historial de movimientos" description={history.target?.nombre}>
      {history.target && (
        <>
          {history.error && <Alert tone="error">{history.error}</Alert>}
          <HistoryBody history={history} />
          <div className={styles.footer}>
            <span>{history.total} movimientos</span>
            <Pagination page={history.page} totalPages={history.totalPages} onChange={history.setPage} />
          </div>
        </>
      )}
    </Modal>
  );
}
