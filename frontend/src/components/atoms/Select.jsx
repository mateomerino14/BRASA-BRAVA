import {ChevronDown} from 'lucide-react';
import {cn} from '../../lib/cn';

const styles = {
  wrapper: 'relative',
  base: 'w-full appearance-none rounded-lg border bg-campo pl-3 pr-9 text-carbon transition-[border-color,box-shadow] duration-200 focus:outline-none focus:ring-4 disabled:opacity-60',
  sizes: {
    sm: 'h-9 text-xs font-semibold',
    md: 'h-12 text-base',
  },
  normal: 'border-arena focus:border-brasa focus:ring-brasa/20',
  invalid: 'border-rojo focus:ring-rojo/15',
  icon: 'pointer-events-none absolute inset-y-0 right-3 my-auto text-cafe',
};

export function Select({options, placeholder, size = 'md', invalid = false, className, ref, ...props}) {
  return (
    <div className={cn(styles.wrapper, className)}>
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(styles.base, styles.sizes[size], invalid ? styles.invalid : styles.normal)}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown size={16} aria-hidden className={styles.icon} />
    </div>
  );
}
