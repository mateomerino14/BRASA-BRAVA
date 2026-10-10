import {Check, CheckCheck, Minus, Plus} from 'lucide-react';
import {Badge} from '../../../components/atoms/Badge';
import {IconButton} from '../../../components/atoms/IconButton';
import {cn} from '../../../lib/cn';
import {removedText} from '../utils/kitchen';

const styles = {
  row: 'flex flex-col gap-2 rounded-xl border px-3 py-2.5 transition-colors sm:flex-row sm:items-center sm:justify-between',
  pending: 'border-arena/50 bg-white',
  done: 'border-verde/40 bg-verde/10',
  text: 'flex min-w-0 flex-col gap-1',
  name: 'flex items-center gap-1.5 text-base font-semibold leading-tight text-carbon',
  check: 'shrink-0 text-verde',
  tags: 'flex flex-wrap gap-1',
  combo: 'text-xs text-cafe',
  removed: 'text-xs font-semibold text-rojo',
  controls: 'flex shrink-0 items-center gap-2 self-end sm:self-auto',
  counter: 'min-w-14 text-center font-display text-2xl leading-none tabular-nums text-carbon',
  total: 'text-base text-cafe',
};

// Una línea del envío con sus unidades listas: −1, +1 o todas
export function KitchenLine({line, busy, onMark}) {
  const done = line.listos === line.cantidad;
  const removed = removedText(line);
  return (
    <li className={cn(styles.row, done ? styles.done : styles.pending)}>
      <div className={styles.text}>
        <span className={styles.name}>
          {done && <Check size={16} aria-hidden className={styles.check} />}
          {line.cantidad}× {line.nombre}
        </span>
        <span className={styles.tags}>
          {line.consumo === 'llevar' ? <Badge tone="warning">Para llevar</Badge> : <Badge tone="neutral">Local</Badge>}
          {line.tipo === 'promocion' && <Badge tone="brand">Promoción</Badge>}
        </span>
        {line.productos.length > 0 && <span className={styles.combo}>{line.productos.map((item) => `${item.cantidad} ${item.nombre}`).join(' + ')}</span>}
        {removed && <span className={styles.removed}>{removed}</span>}
      </div>
      <div className={styles.controls}>
        <IconButton icon={Minus} label={`Restar una lista de ${line.nombre}`} disabled={busy || line.listos === 0} onClick={() => onMark(line, 'restar')} />
        <span aria-label={`${line.listos} de ${line.cantidad} listas`} className={styles.counter}>
          {line.listos}<span className={styles.total}>/{line.cantidad}</span>
        </span>
        <IconButton icon={Plus} tone="success" label={`Sumar una lista de ${line.nombre}`} disabled={busy || done} onClick={() => onMark(line, 'sumar')} />
        <IconButton icon={CheckCheck} tone="success" label={`Marcar todas listas de ${line.nombre}`} disabled={busy || done} onClick={() => onMark(line, 'todos')} />
      </div>
    </li>
  );
}
