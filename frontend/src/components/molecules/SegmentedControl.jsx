import {useId} from 'react';
import {motion} from 'motion/react';
import {cn} from '../../lib/cn';

const styles = {
  group: 'grid gap-1 rounded-xl border border-arena/60 bg-hueso p-1',
  option: 'relative flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-brasa',
  idle: 'text-cafe hover:text-carbon',
  selected: 'text-carbon',
  pill: 'absolute inset-0 rounded-lg bg-white shadow-card',
  content: 'relative flex items-center gap-1.5',
};

const pillSpring = {type: 'spring', stiffness: 420, damping: 34};

// Opciones excluyentes en botones lado a lado; la opción elegida se resalta con una píldora que se desliza
export function SegmentedControl({label, options, value, onChange, className}) {
  const groupId = useId();
  return (
    <div role="radiogroup" aria-label={label} className={cn(styles.group, className)} style={{gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`}}>
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
            className={cn(styles.option, selected ? styles.selected : styles.idle)}
          >
            {selected && <motion.span layoutId={`segment-${groupId}`} transition={pillSpring} className={styles.pill} />}
            <span className={styles.content}>
              {Icon && <Icon size={16} aria-hidden />}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
