import {cn} from '../../lib/cn';

const styles = {
  base: 'h-12 w-full rounded-lg border bg-campo px-4 text-base text-carbon placeholder:text-cafe/60 transition-[border-color,box-shadow] duration-200 focus:outline-none focus:ring-4',
  normal: 'border-arena focus:border-brasa focus:ring-brasa/20',
  invalid: 'border-rojo focus:border-rojo focus:ring-rojo/15',
};

export function Input({invalid = false, className, ref, ...props}) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(styles.base, invalid ? styles.invalid : styles.normal, className)}
      {...props}
    />
  );
}
