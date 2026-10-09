import {motion} from 'motion/react';
import {cn} from '../../lib/cn';

const styles = {
  base: 'inline-flex size-8 items-center justify-center rounded-lg border shadow-card transition-colors disabled:cursor-not-allowed disabled:opacity-50',
  tones: {
    edit: 'border-brasa bg-white text-brasa hover:bg-brasa hover:text-white',
    danger: 'border-rojo/40 bg-rojo/10 text-rojo hover:bg-rojo hover:text-white',
    success: 'border-verde/40 bg-verde/10 text-verde hover:bg-verde hover:text-white',
    neutral: 'border-carbon/30 bg-white text-cafe hover:bg-hueso',
  },
};

const hoverLift = {y: -2};
const tapPress = {scale: 0.9};

export function IconButton({icon: Icon, label, tone = 'neutral', className, disabled, ...props}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      whileHover={disabled ? undefined : hoverLift}
      whileTap={disabled ? undefined : tapPress}
      className={cn(styles.base, styles.tones[tone], className)}
      {...props}
    >
      <Icon size={15} aria-hidden />
    </motion.button>
  );
}
