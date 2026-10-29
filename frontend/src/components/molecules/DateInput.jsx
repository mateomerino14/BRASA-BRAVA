import {useEffect, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {CalendarDays, ChevronLeft, ChevronRight, X} from 'lucide-react';
import {cn} from '../../lib/cn';
import {formatDayMonthYear} from '../../lib/format';

const styles = {
  root: 'relative',
  field: 'flex h-12 w-full items-center gap-3 rounded-lg border bg-campo px-4 text-left text-base transition-[border-color,box-shadow] duration-200 focus:outline-none focus-visible:ring-4',
  normal: 'border-arena focus-visible:border-brasa focus-visible:ring-brasa/20',
  open: 'border-brasa ring-4 ring-brasa/20',
  invalid: 'border-error focus-visible:ring-error/15',
  value: 'flex-1 tabular-nums text-carbon',
  placeholder: 'flex-1 text-cafe/60',
  icon: 'shrink-0 text-cafe',
  clear: 'absolute right-11 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-cafe transition-colors hover:bg-hueso hover:text-carbon',
  popover: 'absolute left-0 top-full z-30 mt-2 w-72 rounded-2xl border border-arena/60 bg-white p-3 shadow-float',
  head: 'mb-2 flex items-center justify-between',
  month: 'font-display text-xl leading-none tracking-wide text-carbon',
  nav: 'flex size-8 items-center justify-center rounded-full text-cafe transition-colors hover:bg-hueso hover:text-carbon disabled:opacity-30 disabled:hover:bg-transparent',
  weekdays: 'grid grid-cols-7 pb-1 text-center text-[11px] font-bold uppercase text-cafe',
  grid: 'grid grid-cols-7 gap-0.5',
  day: 'flex h-9 items-center justify-center rounded-lg text-sm tabular-nums text-carbon transition-colors hover:bg-brasa/10',
  outside: 'text-cafe/40',
  today: 'font-bold text-brasa-oscuro ring-1 ring-inset ring-brasa/50',
  selected: 'bg-brasa font-bold text-white hover:bg-brasa',
  disabled: 'cursor-not-allowed text-cafe/30 hover:bg-transparent',
  foot: 'mt-2 flex justify-between border-t border-arena/50 pt-2',
  footButton: 'rounded-md px-2 py-1 text-xs font-bold text-brasa-oscuro transition-colors hover:bg-brasa/10',
};

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DAYS_SHOWN = 42;
const WEEK = 7;

const pad = (value) => String(value).padStart(2, '0');
const toIso = (year, month, day) => `${year}-${pad(month + 1)}-${pad(day)}`;
const parts = (iso) => iso.split('-').map(Number);

const todayIso = () => {
  const now = new Date();
  return toIso(now.getFullYear(), now.getMonth(), now.getDate());
};

const monthDays = (year, month) => {
  const firstWeekday = (new Date(year, month, 1).getDay() + WEEK - 1) % WEEK;
  return Array.from({length: DAYS_SHOWN}, (_, index) => {
    const date = new Date(year, month, index - firstWeekday + 1);
    return {iso: toIso(date.getFullYear(), date.getMonth(), date.getDate()), day: date.getDate(), inMonth: date.getMonth() === month};
  });
};

export function DateInput({id, value = '', onChange, min, clearable = false, invalid = false, label = 'Fecha', 'aria-describedby': describedBy}) {
  const rootRef = useRef(null);
  const popoverRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => parts(value || min || todayIso()).slice(0, 2));
  const [year, month] = view;
  const today = todayIso();

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    popoverRef.current?.scrollIntoView?.({block: 'nearest'});
    const closeOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', closeOutside);
    document.addEventListener('keydown', closeOnEscape, true);
    return () => {
      document.removeEventListener('mousedown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape, true);
    };
  }, [open]);

  const show = () => {
    setView(parts(value || min || todayIso()).slice(0, 2));
    setOpen((current) => !current);
  };

  const moveMonth = (step) => {
    const date = new Date(year, month - 1 + step, 1);
    setView([date.getFullYear(), date.getMonth() + 1]);
  };

  const pick = (iso) => {
    onChange(iso);
    setOpen(false);
  };

  let fieldState = styles.normal;
  if (invalid) {
    fieldState = styles.invalid;
  }
  else if (open) {
    fieldState = styles.open;
  }
  let atMinMonth = false;
  if (min) {
    const [minYear, minMonthNumber] = parts(min);
    atMinMonth = year < minYear || (year === minYear && month <= minMonthNumber);
  }

  return (
    <div ref={rootRef} className={styles.root}>
      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-describedby={describedBy}
        onClick={show}
        className={cn(styles.field, fieldState)}
      >
        <span className={value ? styles.value : styles.placeholder}>{value ? formatDayMonthYear(value) : 'dd/mm/aaaa'}</span>
        <CalendarDays size={18} aria-hidden className={styles.icon} />
      </button>
      {clearable && value && (
        <button type="button" aria-label={`Quitar ${label.toLowerCase()}`} onClick={() => onChange('')} className={styles.clear}>
          <X size={16} aria-hidden />
        </button>
      )}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={popoverRef}
            role="dialog"
            aria-label={`Calendario: ${label}`}
            initial={{opacity: 0, y: -6}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -6}}
            className={styles.popover}
          >
            <div className={styles.head}>
              <button type="button" aria-label="Mes anterior" disabled={atMinMonth} onClick={() => moveMonth(-1)} className={styles.nav}>
                <ChevronLeft size={18} aria-hidden />
              </button>
              <p aria-live="polite" className={styles.month}>{MONTHS[month - 1]} {year}</p>
              <button type="button" aria-label="Mes siguiente" onClick={() => moveMonth(1)} className={styles.nav}>
                <ChevronRight size={18} aria-hidden />
              </button>
            </div>
            <div aria-hidden className={styles.weekdays}>
              {WEEKDAYS.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
            </div>
            <div className={styles.grid}>
              {monthDays(year, month - 1).map((item) => {
                const blocked = Boolean(min && item.iso < min);
                const [itemYear, itemMonth, itemDay] = parts(item.iso);
                return (
                  <button
                    key={item.iso}
                    type="button"
                    disabled={blocked}
                    aria-label={`${itemDay} de ${MONTHS[itemMonth - 1]} de ${itemYear}`}
                    aria-pressed={item.iso === value}
                    onClick={() => pick(item.iso)}
                    className={cn(
                      styles.day,
                      !item.inMonth && styles.outside,
                      item.iso === today && styles.today,
                      item.iso === value && styles.selected,
                      blocked && styles.disabled,
                    )}
                  >
                    {item.day}
                  </button>
                );
              })}
            </div>
            <div className={styles.foot}>
              <button type="button" disabled={Boolean(min && today < min)} onClick={() => pick(today)} className={styles.footButton}>Hoy</button>
              {clearable && <button type="button" onClick={() => pick('')} className={styles.footButton}>Sin fecha</button>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
