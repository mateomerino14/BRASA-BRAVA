import {Minus, Plus} from 'lucide-react';
import {cn} from '../../lib/cn';

const styles = {
  wrapper: 'inline-flex h-10 items-center rounded-lg border bg-campo',
  normal: 'border-arena',
  invalid: 'border-rojo',
  button: 'flex size-10 items-center justify-center text-cafe transition-colors hover:text-brasa disabled:cursor-not-allowed disabled:opacity-40',
  value: 'w-10 bg-transparent text-center text-base font-semibold tabular-nums text-carbon focus:outline-none',
};

// "Capacidad de P1" → "capacidad de P1" para armar "Sumar capacidad de P1"
const lowerFirst = (text) => text.charAt(0).toLowerCase() + text.slice(1);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Número entero con botones − y + dentro de un rango (capacidad de mesa, cantidad de un pedido)
export function Stepper({label, value, onChange, min = 1, max = 99, invalid = false, className}) {
  const change = (next) => onChange(clamp(next, min, max));
  return (
    <div className={cn(styles.wrapper, invalid ? styles.invalid : styles.normal, className)}>
      <button type="button" aria-label={`Restar ${lowerFirst(label)}`} disabled={value <= min} onClick={() => change(value - 1)} className={styles.button}>
        <Minus size={15} aria-hidden />
      </button>
      <input
        type="text"
        inputMode="numeric"
        aria-label={label}
        value={value}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, '');
          if (digits) {
            change(Number(digits));
          }
        }}
        className={styles.value}
      />
      <button type="button" aria-label={`Sumar ${lowerFirst(label)}`} disabled={value >= max} onClick={() => change(value + 1)} className={styles.button}>
        <Plus size={15} aria-hidden />
      </button>
    </div>
  );
}
