import {cn} from '../../lib/cn';

const styles = {
  wrapper: 'relative',
  base: 'min-h-24 w-full resize-none rounded-lg border bg-crema px-4 py-3 text-base text-carbon placeholder:text-cafe/60 transition-[border-color,box-shadow,background-color] duration-200 focus:bg-white focus:outline-none focus:ring-4',
  normal: 'border-arena focus:border-brasa focus:ring-brasa/20',
  invalid: 'border-rojo focus:border-rojo focus:ring-rojo/15',
  counter: 'pointer-events-none absolute bottom-2 right-3 text-xs text-cafe/70',
  counterFull: 'text-rojo',
};

export function Textarea({invalid = false, maxLength, value = '', className, ref, ...props}) {
  return (
    <div className={styles.wrapper}>
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        maxLength={maxLength}
        value={value}
        className={cn(styles.base, invalid ? styles.invalid : styles.normal, className)}
        {...props}
      />
      {maxLength && (
        <span aria-hidden className={cn(styles.counter, value.length >= maxLength && styles.counterFull)}>
          {value.length}/{maxLength}
        </span>
      )}
    </div>
  );
}
