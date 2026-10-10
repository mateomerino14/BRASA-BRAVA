import {motion} from 'motion/react';
import {cn} from '../../lib/cn';

const styles = {
  card: 'flex min-w-0 flex-col items-start gap-2 rounded-card border bg-white p-3 text-left shadow-card transition-colors sm:flex-row sm:items-center sm:gap-4 sm:p-4',
  idle: 'border-arena/40 hover:border-brasa/60',
  active: 'border-brasa ring-4 ring-brasa/15',
  iconBox: 'flex size-9 shrink-0 items-center justify-center rounded-xl sm:size-12',
  text: 'min-w-0',
  value: 'font-display text-3xl leading-none text-carbon sm:text-4xl',
  label: 'mt-1 text-xs leading-tight text-cafe sm:text-sm',
  tones: {
    brand: 'bg-brasa/10 text-brasa',
    warning: 'bg-mostaza/20 text-cafe',
    danger: 'bg-rojo/10 text-rojo',
  },
};

const hoverLift = {y: -2};
const tapPress = {scale: 0.98};

// Tarjeta de resumen con número grande; si recibe onClick funciona como filtro rápido
export function StatCard({icon: Icon, label, value, tone = 'brand', active = false, onClick}) {
  const content = (
    <>
      <span className={cn(styles.iconBox, styles.tones[tone])}>
        <Icon size={22} aria-hidden />
      </span>
      <span className={styles.text}>
        <span className={styles.value}>{value}</span>
        <span className={cn(styles.label, 'block')}>{label}</span>
      </span>
    </>
  );
  if (!onClick) {
    return <div className={cn(styles.card, styles.idle)}>{content}</div>;
  }
  return (
    <motion.button type="button" aria-pressed={active} onClick={onClick} whileHover={hoverLift} whileTap={tapPress} className={cn(styles.card, active ? styles.active : styles.idle)}>
      {content}
    </motion.button>
  );
}
