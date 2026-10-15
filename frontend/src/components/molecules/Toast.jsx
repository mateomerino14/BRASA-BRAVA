import {motion} from 'motion/react';
import {CircleAlert, CircleCheck, X} from 'lucide-react';
import {cn} from '../../lib/cn';

const styles = {
  toast: 'pointer-events-auto flex w-full items-start gap-3 rounded-2xl border bg-white py-3 pl-3 pr-3 shadow-float',
  tones: {
    error: 'border-error/35',
    success: 'border-verde/35',
  },
  iconBox: 'flex size-9 shrink-0 items-center justify-center rounded-full',
  iconTones: {
    error: 'bg-error text-white',
    success: 'bg-verde text-white',
  },
  body: 'min-w-0 flex-1 pt-0.5',
  title: 'font-display text-lg leading-tight',
  titleTones: {
    error: 'text-error',
    success: 'text-verde',
  },
  message: 'text-sm font-medium text-carbon',
  close: 'shrink-0 rounded-full p-1 text-cafe transition hover:bg-hueso hover:text-carbon',
};

const ICONS = {error: CircleAlert, success: CircleCheck};
const TITLES = {error: 'No se pudo completar', success: 'Listo'};
const hidden = {opacity: 0, y: -24, scale: 0.96};
const visible = {opacity: 1, y: 0, scale: 1};
const leave = {opacity: 0, y: -12, scale: 0.96};
const spring = {type: 'spring', stiffness: 380, damping: 28};

export function Toast({tone = 'error', title, message, onClose}) {
  const Icon = ICONS[tone];

  return (
    <motion.div
      layout
      role={tone === 'error' ? 'alert' : 'status'}
      initial={hidden}
      animate={visible}
      exit={leave}
      transition={spring}
      className={cn(styles.toast, styles.tones[tone])}
    >
      <span className={cn(styles.iconBox, styles.iconTones[tone])}>
        <Icon size={20} aria-hidden />
      </span>
      <div className={styles.body}>
        <p className={cn(styles.title, styles.titleTones[tone])}>{title ?? TITLES[tone]}</p>
        <p className={styles.message}>{message}</p>
      </div>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Cerrar aviso" className={styles.close}>
          <X size={18} />
        </button>
      )}
    </motion.div>
  );
}
