import {motion} from 'motion/react';
import {cn} from '../../lib/cn';

const styles = {
  track: 'h-2 w-full overflow-hidden rounded-full bg-hueso',
  fill: 'h-full rounded-full',
  tones: {
    success: 'bg-verde',
    warning: 'bg-mostaza',
    danger: 'bg-rojo',
    brand: 'bg-brasa',
  },
};

const fillTransition = {type: 'spring', stiffness: 140, damping: 22};

// Barra de avance de "value" sobre "max" (unidades listas de un pedido, pasos completados)
export function ProgressBar({value, max, label, tone = 'brand', className}) {
  let ratio = 0;
  if (max > 0) {
    ratio = Math.min(1, Math.max(0, value / max));
  }
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} className={cn(styles.track, className)}>
      <motion.div className={cn(styles.fill, styles.tones[tone])} initial={false} animate={{width: `${Math.round(ratio * 100)}%`}} transition={fillTransition} />
    </div>
  );
}
