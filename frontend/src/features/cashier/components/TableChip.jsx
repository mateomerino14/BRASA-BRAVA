import {Clock, HandCoins} from 'lucide-react';
import {cn} from '../../../lib/cn';
import {formatAmount, formatWait} from '../../../lib/format';
import {waitMinutes, waitTone} from '../utils/kitchen';

const styles = {
  chip: 'flex h-16 min-w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 px-3 leading-none transition-[border-color,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brasa',
  free: 'border-arena/60 bg-white text-cafe hover:border-brasa/60',
  kitchen: 'border-brasa bg-brasa/10 text-carbon',
  charge: 'border-verde bg-verde/10 text-carbon',
  active: 'ring-4 ring-brasa/30',
  name: 'whitespace-nowrap font-display text-xl text-carbon',
  meta: 'flex items-center gap-1 whitespace-nowrap text-[11px] font-bold tabular-nums',
  wait: 'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5',
  tones: {success: 'bg-verde text-white', warning: 'bg-mostaza text-carbon', danger: 'bg-rojo text-white'},
  ready: 'text-verde',
};

// Estado de una mesa en la fila: libre, con algo en cocina (y cuánto espera) o lista para cobrar
const stateOf = (venta) => {
  if (!venta) {
    return 'free';
  }
  if (venta.esperaDesde) {
    return 'kitchen';
  }
  return 'charge';
};

const labelOf = (mesa, state, minutes) => {
  if (state === 'free') {
    return `${mesa.nombre}, libre`;
  }
  if (state === 'kitchen') {
    return `${mesa.nombre}, Bs ${formatAmount(mesa.venta.total)}, en cocina hace ${formatWait(minutes)}`;
  }
  return `${mesa.nombre}, Bs ${formatAmount(mesa.venta.total)}, lista para cobrar`;
};

// Ficha de una mesa en la barra de Caja
export function TableChip({mesa, now, active, onSelect}) {
  const state = stateOf(mesa.venta);
  let minutes = 0;
  if (state === 'kitchen') {
    minutes = waitMinutes(mesa.venta.esperaDesde, now);
  }
  return (
    <button
      type="button"
      aria-label={labelOf(mesa, state, minutes)}
      aria-pressed={active}
      onClick={() => onSelect(mesa)}
      className={cn(styles.chip, styles[state], active && styles.active)}
    >
      <span className={styles.name}>{mesa.nombre}</span>
      {state === 'free' && <span className={styles.meta}>Libre</span>}
      {state === 'kitchen' && (
        <span className={styles.meta}>
          Bs {formatAmount(mesa.venta.total)}
          <span className={cn(styles.wait, styles.tones[waitTone(minutes)])}><Clock size={10} aria-hidden />{formatWait(minutes)}</span>
        </span>
      )}
      {state === 'charge' && (
        <span className={cn(styles.meta, styles.ready)}><HandCoins size={12} aria-hidden /> Bs {formatAmount(mesa.venta.total)}</span>
      )}
    </button>
  );
}
