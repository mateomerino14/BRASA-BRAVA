import {Amount} from '../atoms/Amount';
import {Badge} from '../atoms/Badge';
import {cn} from '../../lib/cn';
import {formatAmount} from '../../lib/format';

const styles = {
  wrapper: 'inline-flex flex-col items-end gap-0.5',
  regular: 'text-xs text-cafe line-through',
  row: 'flex items-center gap-2',
  start: 'items-start',
};

const PERCENT = 100;

// Precio con promoción: el regular tachado arriba, el final grande y el ahorro en porcentaje
export function PriceTag({regular, promo, size, align = 'end'}) {
  let savings = 0;
  if (regular > 0) {
    savings = Math.round((1 - promo / regular) * PERCENT);
  }
  return (
    <span className={cn(styles.wrapper, align === 'start' && styles.start)}>
      <span className={styles.regular} aria-label={`Precio regular Bs ${formatAmount(regular)}`}>Bs {formatAmount(regular)}</span>
      <span className={styles.row}>
        <Amount prefix="Bs" value={formatAmount(promo)} size={size} />
        {savings > 0 && <Badge tone="success">−{savings}%</Badge>}
      </span>
    </span>
  );
}
