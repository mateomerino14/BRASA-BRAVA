import {cn} from '../../lib/cn';
import {Input} from './Input';

const styles = {
  wrapper: 'relative',
  affix: 'pointer-events-none absolute inset-y-0 flex items-center text-sm font-semibold text-cafe',
  prefix: 'left-4',
  suffix: 'right-4',
  input: 'text-right tabular-nums',
  withPrefix: 'pl-12',
  withSuffix: 'pr-20',
};

// Campo numérico con decimales y texto fijo antes (Bs) o después (kg, unidades)
export function NumberInput({prefix, suffix, className, ...props}) {
  return (
    <div className={cn(styles.wrapper, className)}>
      {prefix && <span aria-hidden className={cn(styles.affix, styles.prefix)}>{prefix}</span>}
      <Input
        inputMode="decimal"
        autoComplete="off"
        placeholder="0"
        className={cn(styles.input, prefix && styles.withPrefix, suffix && styles.withSuffix)}
        {...props}
      />
      {suffix && <span aria-hidden className={cn(styles.affix, styles.suffix)}>{suffix}</span>}
    </div>
  );
}
