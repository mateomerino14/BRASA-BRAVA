import {cn} from '../../lib/cn';

const styles = {
  group: 'flex h-12 w-full overflow-hidden rounded-lg border bg-campo transition-[border-color,box-shadow] duration-200 focus-within:ring-4',
  normal: 'border-arena focus-within:border-brasa focus-within:ring-brasa/20',
  invalid: 'border-error focus-within:ring-error/15',
  disabled: 'opacity-60',
  input: 'min-w-0 flex-1 bg-transparent px-4 text-base text-carbon tabular-nums placeholder:text-cafe/60 focus:outline-none disabled:cursor-not-allowed',
  affix: 'flex min-w-12 shrink-0 select-none items-center justify-center bg-hueso px-3.5 text-sm font-bold text-cafe',
  prefix: 'border-r border-arena',
  suffix: 'border-l border-arena',
};

export function NumberInput({prefix, suffix, invalid = false, disabled, className, ref, ...props}) {
  return (
    <div className={cn(styles.group, invalid ? styles.invalid : styles.normal, disabled && styles.disabled, className)}>
      {prefix && <span aria-hidden className={cn(styles.affix, styles.prefix)}>{prefix}</span>}
      <input
        ref={ref}
        inputMode="decimal"
        autoComplete="off"
        placeholder="0"
        aria-invalid={invalid || undefined}
        disabled={disabled}
        className={styles.input}
        {...props}
      />
      {suffix && <span aria-hidden className={cn(styles.affix, styles.suffix)}>{suffix}</span>}
    </div>
  );
}
