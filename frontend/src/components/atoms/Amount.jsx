import {cn} from '../../lib/cn';

const styles = {
  wrapper: 'inline-flex items-baseline gap-1 whitespace-nowrap',
  affix: 'text-xs font-semibold text-cafe',
  value: 'font-display leading-none tabular-nums text-carbon',
  sizes: {
    md: 'text-2xl',
    lg: 'text-3xl',
  },
};

// Número grande con la fuente de títulos y su moneda o unidad en texto chico (Bebas solo tiene mayúsculas)
export function Amount({value, prefix, suffix, size = 'md', className, valueClassName}) {
  const label = [prefix, value, suffix].filter(Boolean).join(' ');
  return (
    <span aria-label={label} className={cn(styles.wrapper, className)}>
      {prefix && <span aria-hidden className={styles.affix}>{prefix}</span>}
      <span aria-hidden className={cn(styles.value, styles.sizes[size], valueClassName)}>{value}</span>
      {suffix && <span aria-hidden className={styles.affix}>{suffix}</span>}
    </span>
  );
}
