import {Search, X} from 'lucide-react';
import {cn} from '../../lib/cn';

const styles = {
  wrapper: 'relative min-w-60 flex-1',
  icon: 'pointer-events-none absolute inset-y-0 left-3.5 my-auto text-cafe',
  input: 'h-10 w-full rounded-lg border border-arena/60 bg-crema/50 pl-10 pr-9 text-sm text-carbon placeholder:text-cafe/70 transition-[border-color,box-shadow,background-color] focus:border-brasa focus:bg-white focus:outline-none focus:ring-4 focus:ring-brasa/20',
  clear: 'absolute inset-y-0 right-2 my-auto flex size-7 items-center justify-center rounded-md text-cafe hover:bg-hueso hover:text-carbon',
};

export function SearchInput({value, onChange, placeholder, label, className}) {
  return (
    <div className={cn(styles.wrapper, className)}>
      <Search size={16} aria-hidden className={styles.icon} />
      <input
        type="search"
        aria-label={label ?? placeholder}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={styles.input}
      />
      {value && (
        <button type="button" aria-label="Limpiar búsqueda" onClick={() => onChange('')} className={styles.clear}>
          <X size={15} />
        </button>
      )}
    </div>
  );
}
