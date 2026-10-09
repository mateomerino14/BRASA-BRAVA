import {useEffect, useState} from 'react';
import {Clock} from 'lucide-react';
import {cn} from '../../lib/cn';
import {formatDateTime} from '../../lib/format';

const styles = {
  pill: 'inline-flex items-center gap-3 rounded-full border border-arena/60 bg-white/80 px-5 py-2 text-base text-carbon shadow-card backdrop-blur',
  icon: 'text-brasa',
  divider: 'h-4 w-px bg-arena',
  time: 'font-semibold tabular-nums',
};

const tickMs = 1000;

export function LiveClock({className, initialDate}) {
  const [now, setNow] = useState(() => initialDate ?? new Date());

  useEffect(() => {
    if (initialDate) {
      return undefined;
    }
    const timer = setInterval(() => setNow(new Date()), tickMs);
    return () => clearInterval(timer);
  }, [initialDate]);

  const {date, time} = formatDateTime(now);

  return (
    <p className={cn(styles.pill, className)}>
      <Clock size={18} className={styles.icon} aria-hidden />
      <span>{date}</span>
      <span aria-hidden className={styles.divider} />
      <time className={styles.time} dateTime={now.toISOString()}>
        {time}
      </time>
    </p>
  );
}
