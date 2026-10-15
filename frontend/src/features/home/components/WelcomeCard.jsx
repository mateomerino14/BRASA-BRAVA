import {useEffect, useState} from 'react';
import {motion} from 'motion/react';
import {formatDateTime} from '../../../lib/format';
import {greetingFor} from '../utils/greeting';

const styles = {
  board: 'relative grid items-center gap-4 overflow-hidden rounded-3xl bg-carbon bg-grill px-6 py-6 text-crema shadow-card sm:grid-cols-[1fr_auto] sm:px-8',
  coal: 'pointer-events-none absolute -bottom-20 -left-16 h-40 w-64 rounded-full bg-[radial-gradient(closest-side,rgb(247_148_29/0.45),transparent)] blur-sm animate-coal',
  text: 'relative',
  greeting: 'font-accent text-3xl leading-tight sm:text-4xl',
  date: 'mt-2 font-semibold text-mostaza',
  clock: 'relative sm:text-right',
  time: 'font-display text-5xl leading-none tracking-wide text-brasa tabular-nums sm:text-6xl',
  caption: 'text-xs text-arena',
};

const TICK_MS = 1000;
const hidden = {opacity: 0, y: 16};
const visible = {opacity: 1, y: 0};

const hoursAndMinutes = (time) => time.slice(0, 5);

export function WelcomeCard({name, clockDate}) {
  const [now, setNow] = useState(() => clockDate ?? new Date());

  useEffect(() => {
    if (clockDate) {
      return undefined;
    }
    const timer = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(timer);
  }, [clockDate]);

  const {date, time} = formatDateTime(now);

  return (
    <motion.section initial={hidden} animate={visible} className={styles.board}>
      <span aria-hidden className={styles.coal} />
      <div className={styles.text}>
        <h2 className={styles.greeting}>{greetingFor(name, now)}</h2>
        <p className={styles.date}>{date}</p>
      </div>
      <div className={styles.clock}>
        <time dateTime={now.toISOString()} className={styles.time}>{hoursAndMinutes(time)}</time>
        <p className={styles.caption}>Hora del local</p>
      </div>
    </motion.section>
  );
}
