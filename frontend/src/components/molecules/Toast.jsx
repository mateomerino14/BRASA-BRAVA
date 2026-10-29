import {motion} from 'motion/react';
import {CircleAlert, CircleCheck, X} from 'lucide-react';
import {cn} from '../../lib/cn';

const styles = {
  toast: 'pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-2xl bg-white py-4 pl-5 pr-3 shadow-float ring-1 ring-carbon/5',
  accent: 'absolute inset-y-0 left-0 w-1.5',
  iconBox: 'flex size-10 shrink-0 items-center justify-center rounded-full',
  body: 'min-w-0 flex-1',
  title: 'font-display text-xl leading-tight tracking-wide',
  message: 'mt-0.5 text-sm font-medium leading-snug text-carbon',
  close: 'shrink-0 rounded-full p-1.5 text-cafe transition hover:rotate-90 hover:bg-hueso hover:text-carbon',
  progress: 'absolute bottom-0 left-0 h-1 origin-left',
  tones: {
    error: {accent: 'bg-error', icon: 'bg-error/10 text-error', title: 'text-error', progress: 'bg-error/40'},
    success: {accent: 'bg-verde', icon: 'bg-verde/10 text-verde', title: 'text-verde', progress: 'bg-verde/40'},
  },
};

const ICONS = {error: CircleAlert, success: CircleCheck};
const TITLES = {error: 'No se pudo completar', success: 'Listo'};
const hidden = {opacity: 0, x: 80, scale: 0.96};
const visible = {opacity: 1, x: 0, scale: 1};
const leave = {opacity: 0, x: 80, transition: {duration: 0.2}};
const spring = {type: 'spring', stiffness: 360, damping: 30};
const fullWidth = {scaleX: 1};
const emptyWidth = {scaleX: 0};

export function Toast({tone = 'error', title, message, duration, onClose}) {
  const Icon = ICONS[tone];
  const colors = styles.tones[tone];

  return (
    <motion.div
      layout
      role={tone === 'error' ? 'alert' : 'status'}
      initial={hidden}
      animate={visible}
      exit={leave}
      transition={spring}
      className={styles.toast}
    >
      <span aria-hidden className={cn(styles.accent, colors.accent)} />
      <span className={cn(styles.iconBox, colors.icon)}>
        <Icon size={22} strokeWidth={2.2} aria-hidden />
      </span>
      <div className={styles.body}>
        <p className={cn(styles.title, colors.title)}>{title ?? TITLES[tone]}</p>
        <p className={styles.message}>{message}</p>
      </div>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Cerrar aviso" className={styles.close}>
          <X size={18} />
        </button>
      )}
      {duration && (
        <motion.span
          aria-hidden
          initial={fullWidth}
          animate={emptyWidth}
          transition={{duration: duration / 1000, ease: 'linear'}}
          className={cn(styles.progress, 'w-full', colors.progress)}
        />
      )}
    </motion.div>
  );
}
