import {useId} from 'react';
import {motion} from 'motion/react';
import {cn} from '../../lib/cn';
import {ScrollRow} from './ScrollRow';

const styles = {
  chip: 'relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-brasa',
  idle: 'border-arena/70 bg-white text-cafe hover:border-brasa/60 hover:text-carbon',
  selected: 'border-brasa text-white',
  pill: 'absolute inset-0 rounded-full bg-brasa shadow-brasa',
  content: 'relative flex items-center gap-2',
  count: 'rounded-full px-1.5 text-xs tabular-nums',
  countIdle: 'bg-hueso text-cafe',
  countSelected: 'bg-white/25 text-white',
  srOnly: 'sr-only',
};

const pillSpring = {type: 'spring', stiffness: 420, damping: 34};

// Opciones excluyentes en chips que se desplazan de lado (secciones, categorías). Si no entran, aparecen flechas
// y el borde se difumina; cada chip puede mostrar un contador con su texto para lectores de pantalla
export function ChipTabs({label, options, value, onChange, className}) {
  const groupId = useId();
  return (
    <ScrollRow label={label} role="radiogroup" count={options.length} className={className}>
      {options.map((option) => {
        const selected = option.value === value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(styles.chip, selected ? styles.selected : styles.idle)}
          >
            {selected && <motion.span layoutId={`chip-${groupId}`} transition={pillSpring} className={styles.pill} />}
            <span className={styles.content}>
              {Icon && <Icon size={15} aria-hidden />}
              {option.label}
              {option.count !== undefined && (
                <>
                  <span aria-hidden className={cn(styles.count, selected ? styles.countSelected : styles.countIdle)}>{option.count}</span>
                  <span className={styles.srOnly}>, {option.countLabel ?? option.count}</span>
                </>
              )}
            </span>
          </button>
        );
      })}
    </ScrollRow>
  );
}
