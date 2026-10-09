import {ChevronLeft, ChevronRight} from 'lucide-react';
import {cn} from '../../lib/cn';

const styles = {
  nav: 'flex items-center gap-1',
  button: 'flex h-7 min-w-7 items-center justify-center rounded border border-arena/60 bg-white px-2 text-xs text-cafe transition-colors hover:border-brasa hover:text-brasa disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-arena/60 disabled:hover:text-cafe',
  active: 'border-brasa bg-brasa font-bold text-white hover:text-white',
};

const maxVisiblePages = 5;

const visiblePages = (page, totalPages) => {
  const half = Math.floor(maxVisiblePages / 2);
  const start = Math.max(1, Math.min(page - half, totalPages - maxVisiblePages + 1));
  const end = Math.min(totalPages, start + maxVisiblePages - 1);
  return Array.from({length: end - start + 1}, (_, index) => start + index);
};

export function Pagination({page, totalPages, onChange}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav aria-label="Paginación" className={styles.nav}>
      <button type="button" aria-label="Página anterior" disabled={page <= 1} onClick={() => onChange(page - 1)} className={styles.button}>
        <ChevronLeft size={14} />
      </button>
      {visiblePages(page, totalPages).map((number) => (
        <button
          key={number}
          type="button"
          aria-label={`Página ${number}`}
          aria-current={number === page ? 'page' : undefined}
          onClick={() => onChange(number)}
          className={cn(styles.button, number === page && styles.active)}
        >
          {number}
        </button>
      ))}
      <button type="button" aria-label="Página siguiente" disabled={page >= totalPages} onClick={() => onChange(page + 1)} className={styles.button}>
        <ChevronRight size={14} />
      </button>
    </nav>
  );
}
