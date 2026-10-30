import {motion} from 'motion/react';
import {CircleAlert, CircleCheck, Info, TriangleAlert} from 'lucide-react';
import {cn} from '../../lib/cn';

const styles = {
  base: 'flex items-start gap-2 rounded-lg border px-3 py-2 text-sm font-medium',
  icon: 'mt-px shrink-0',
  tones: {
    error: 'border-error/40 bg-error/10 text-error',
    success: 'border-verde/40 bg-verde/10 text-verde',
    info: 'border-brasa/40 bg-brasa/10 text-carbon',
    warning: 'border-mostaza/60 bg-mostaza/15 text-carbon',
  },
};

const ICONS = {error: CircleAlert, success: CircleCheck, info: Info, warning: TriangleAlert};
const enter = {opacity: 0, y: -6};
const visible = {opacity: 1, y: 0};

export function Alert({tone = 'info', className, children}) {
  const Icon = ICONS[tone];

  return (
    <motion.div
      role={tone === 'error' ? 'alert' : 'status'}
      initial={enter}
      animate={visible}
      className={cn(styles.base, styles.tones[tone], className)}
    >
      <Icon size={18} className={styles.icon} aria-hidden />
      <span>{children}</span>
    </motion.div>
  );
}
