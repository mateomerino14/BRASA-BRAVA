import {cn} from '../../../lib/cn';
import {formatAmount} from '../../../lib/format';
import {CONSUMPTION_LABELS} from '../constants/cashier';
import {exclusionText} from '../utils/cart';

const styles = {
  grid: 'grid grid-cols-[2.75rem_minmax(0,1fr)_5.5rem_4.5rem] items-start gap-x-2',
  head: 'pb-1 text-[11px] font-bold uppercase tracking-wide text-cafe',
  right: 'text-right',
  line: 'flex flex-col gap-2 py-2.5',
  qty: 'font-display text-lg leading-tight text-carbon',
  text: 'flex min-w-0 flex-col gap-0.5',
  name: 'text-sm font-semibold leading-tight text-carbon',
  combo: 'text-xs text-cafe',
  exclusions: 'text-xs font-medium text-rojo',
  ready: 'text-xs font-semibold text-verde',
  pending: 'text-xs text-cafe',
  consumo: 'text-sm text-carbon',
  subtotal: 'text-right text-sm font-semibold tabular-nums text-carbon',
  actions: 'flex items-center justify-between gap-2',
};

export function OrderLineHeader() {
  return (
    <div aria-hidden className={cn(styles.grid, styles.head)}>
      <span>Cant.</span>
      <span>Producto</span>
      <span>Consumo</span>
      <span className={styles.right}>Bs</span>
    </div>
  );
}

export function OrderLine({line, actions}) {
  const combo = line.tipo === 'promocion';
  const removed = exclusionText(line.exclusiones, {combo});
  const products = (line.productos ?? []).map((item) => `${item.cantidad} ${item.nombre}`).join(' + ');
  return (
    <div className={styles.line}>
      <div className={styles.grid}>
        <span className={styles.qty}>{line.cantidad}</span>
        <span className={styles.text}>
          <span className={styles.name}>{line.nombre}</span>
          {products && <span className={styles.combo}>{products}</span>}
          {removed && <span className={styles.exclusions}>{removed}</span>}
          {line.listos !== undefined && line.listos === line.cantidad && <span className={styles.ready}>Listo</span>}
          {line.listos !== undefined && line.listos < line.cantidad && <span className={styles.pending}>{line.listos} de {line.cantidad} listos</span>}
        </span>
        <span className={styles.consumo}>{CONSUMPTION_LABELS[line.consumo]}</span>
        <span className={styles.subtotal}>{formatAmount(line.subtotal)}</span>
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
