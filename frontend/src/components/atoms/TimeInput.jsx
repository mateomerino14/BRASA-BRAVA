import {X} from 'lucide-react';
import {cn} from '../../lib/cn';

const styles = {
  group: 'flex h-12 w-full items-center gap-1 rounded-lg border bg-campo pl-1 pr-1 transition-[border-color,box-shadow] duration-200 focus-within:ring-4',
  normal: 'border-arena focus-within:border-brasa focus-within:ring-brasa/20',
  invalid: 'border-error focus-within:ring-error/15',
  part: 'h-10 cursor-pointer appearance-none rounded-md bg-transparent px-2 text-center text-base text-carbon tabular-nums transition-colors hover:bg-hueso focus:outline-none',
  empty: 'text-cafe/60',
  colon: 'text-base font-semibold text-cafe',
  periods: 'ml-auto flex rounded-md bg-hueso p-0.5',
  period: 'h-9 rounded px-2.5 text-xs font-bold text-cafe transition-colors hover:text-carbon',
  periodOn: 'bg-white text-carbon shadow-card',
  clear: 'ml-1 flex size-8 shrink-0 items-center justify-center rounded-md text-cafe transition-colors hover:bg-hueso hover:text-carbon',
};

const NOON = 12;
const HOURS = Array.from({length: NOON}, (_, index) => String(index + 1));
const MINUTE_STEP = 5;
const MINUTES_PER_HOUR = 60;
const MINUTES = Array.from({length: MINUTES_PER_HOUR / MINUTE_STEP}, (_, index) => String(index * MINUTE_STEP).padStart(2, '0'));
const DEFAULT_PERIOD = 'PM';

const pad = (value) => String(value).padStart(2, '0');

const split = (value) => {
  if (!value) {
    return {hour: '', minute: '', period: DEFAULT_PERIOD};
  }
  const [hours, minutes] = value.split(':').map(Number);
  let period = 'AM';
  if (hours >= NOON) {
    period = 'PM';
  }
  return {hour: String(hours % NOON || NOON), minute: pad(minutes), period};
};

const join = ({hour, minute, period}) => {
  let hours = Number(hour) % NOON;
  if (period === 'PM') {
    hours += NOON;
  }
  return `${pad(hours)}:${minute || '00'}`;
};

export function TimeInput({id, value = '', onChange, invalid = false, label = 'Hora', 'aria-describedby': describedBy, className}) {
  const parts = split(value);

  const change = (changes) => {
    const next = {...parts, ...changes};
    if (!next.hour) {
      onChange('');
      return;
    }
    onChange(join(next));
  };

  return (
    <div role="group" aria-label={label} className={cn(styles.group, invalid ? styles.invalid : styles.normal, className)}>
      <select
        id={id}
        aria-label={`${label}: hora`}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        value={parts.hour}
        onChange={(event) => change({hour: event.target.value})}
        className={cn(styles.part, !parts.hour && styles.empty)}
      >
        <option value="">--</option>
        {HOURS.map((hour) => <option key={hour} value={hour}>{hour}</option>)}
      </select>
      <span aria-hidden className={styles.colon}>:</span>
      <select
        aria-label={`${label}: minutos`}
        value={parts.minute}
        disabled={!parts.hour}
        onChange={(event) => change({minute: event.target.value})}
        className={cn(styles.part, !parts.hour && styles.empty)}
      >
        {!parts.hour && <option value="">--</option>}
        {MINUTES.map((minute) => <option key={minute} value={minute}>{minute}</option>)}
      </select>
      <span className={styles.periods}>
        {['AM', 'PM'].map((period) => (
          <button
            key={period}
            type="button"
            aria-pressed={parts.period === period}
            disabled={!parts.hour}
            onClick={() => change({period})}
            className={cn(styles.period, parts.period === period && parts.hour && styles.periodOn)}
          >
            {period}
          </button>
        ))}
      </span>
      {value && (
        <button type="button" aria-label={`Quitar ${label.toLowerCase()}`} onClick={() => onChange('')} className={styles.clear}>
          <X size={16} aria-hidden />
        </button>
      )}
    </div>
  );
}
