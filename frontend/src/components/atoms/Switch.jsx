import {motion} from 'motion/react';
import {cn} from '../../lib/cn';

const styles = {
  wrapper: 'inline-flex items-center gap-2',
  track: 'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent px-0.5 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brasa disabled:cursor-not-allowed disabled:opacity-50',
  on: 'bg-verde',
  off: 'bg-arena',
  thumb: 'size-4 rounded-full bg-white shadow-pill',
  label: 'text-xs font-semibold',
  labelOn: 'text-verde',
  labelOff: 'text-cafe',
};

const thumbSpring = {type: 'spring', stiffness: 600, damping: 32};
const THUMB_TRAVEL_PX = 20;

// Interruptor de encendido/apagado con texto visible para cada estado
export function Switch({checked, onChange, label, onText, offText, disabled = false, className}) {
  return (
    <span className={cn(styles.wrapper, className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(styles.track, checked ? styles.on : styles.off)}
      >
        <motion.span aria-hidden className={styles.thumb} animate={{x: checked ? THUMB_TRAVEL_PX : 0}} transition={thumbSpring} />
      </button>
      {(onText || offText) && (
        <span aria-hidden className={cn(styles.label, checked ? styles.labelOn : styles.labelOff)}>
          {checked ? onText : offText}
        </span>
      )}
    </span>
  );
}
