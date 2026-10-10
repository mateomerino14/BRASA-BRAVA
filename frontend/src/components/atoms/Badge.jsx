import {cn} from '../../lib/cn';

const styles = {
  base: 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-bold',
  dot: 'size-1.5 rounded-full bg-current',
  tones: {
    success: 'bg-verde/10 text-verde border-verde',
    danger: 'bg-rojo/10 text-rojo border-rojo',
    warning: 'bg-mostaza/15 text-cafe border-mostaza',
    neutral: 'bg-hueso text-carbon border-arena/60',
    brand: 'bg-brasa/10 text-brasa border-brasa',
  },
};

export function Badge({tone = 'neutral', dot = false, className, children}) {
  return (
    <span className={cn(styles.base, styles.tones[tone], className)}>
      {dot && <span aria-hidden className={styles.dot} />}
      {children}
    </span>
  );
}
