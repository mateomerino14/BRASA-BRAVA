import {motion} from 'motion/react';
import {cn} from '../../lib/cn';
import {levelRatio} from '../../lib/level';

const styles = {
  track: 'h-1.5 w-full overflow-hidden rounded-full bg-hueso',
  fill: 'h-full rounded-full',
  tones: {
    success: 'bg-verde',
    warning: 'bg-mostaza',
    danger: 'bg-rojo',
  },
};

const fillTransition = {type: 'spring', stiffness: 120, damping: 20};
// Barra que muestra cuánto stock queda comparado con el mínimo
export function LevelBar({value, minimum, tone = 'success', className}) {
  const percent = `${Math.round(levelRatio(value, minimum) * 100)}%`;
  return (
    <div aria-hidden className={cn(styles.track, className)}>
      <motion.div className={cn(styles.fill, styles.tones[tone])} initial={{width: 0}} animate={{width: percent}} transition={fillTransition} />
    </div>
  );
}
