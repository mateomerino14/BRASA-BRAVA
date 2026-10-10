import {motion} from 'motion/react';
import {Plus} from 'lucide-react';

const styles = {
  card: 'flex items-center justify-between gap-4 rounded-card border border-arena/60 bg-white p-4 shadow-card',
  info: 'flex min-w-0 items-center gap-3',
  iconBox: 'flex size-10 shrink-0 items-center justify-center rounded-lg border border-arena bg-crema text-brasa',
  title: 'font-display text-xl leading-tight tracking-wide text-carbon',
  subtitle: 'text-xs text-cafe',
  action: 'flex shrink-0 items-center gap-3',
  actionLabel: 'hidden font-display text-base tracking-wide text-cafe sm:inline',
  button: 'flex size-12 items-center justify-center rounded-xl bg-brasa text-white shadow-brasa transition-colors hover:bg-brasa-oscuro',
};

const hoverSpin = {rotate: 90, scale: 1.05};
const tapPress = {scale: 0.92};

export function RegisterCallout({icon: Icon, title, subtitle, actionLabel, onAction}) {
  return (
    <section className={styles.card}>
      <div className={styles.info}>
        <span className={styles.iconBox}>
          <Icon size={20} aria-hidden />
        </span>
        <div>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </div>
      <div className={styles.action}>
        <span aria-hidden className={styles.actionLabel}>{actionLabel}:</span>
        <motion.button type="button" aria-label={actionLabel} onClick={onAction} whileHover={hoverSpin} whileTap={tapPress} className={styles.button}>
          <Plus size={24} aria-hidden />
        </motion.button>
      </div>
    </section>
  );
}
