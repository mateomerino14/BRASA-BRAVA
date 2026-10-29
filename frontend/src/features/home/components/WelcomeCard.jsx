import {useEffect, useState} from 'react';
import {motion, useReducedMotionConfig} from 'motion/react';
import {formatDateTime} from '../../../lib/format';
import {greetingFor} from '../utils/greeting';
import localMp4 from '../../../assets/local/local.mp4';
import localWebm from '../../../assets/local/local.webm';
import localPoster from '../../../assets/local/local.jpg';

const styles = {
  board: 'relative grid overflow-hidden rounded-3xl bg-carbon bg-grill text-crema shadow-card sm:grid-cols-[1fr_48%]',
  coal: 'pointer-events-none absolute -bottom-20 -left-16 h-40 w-64 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-brasa)_45%,transparent),transparent)] blur-sm animate-coal',
  text: 'relative self-center px-6 py-6 sm:px-8 sm:py-8',
  greeting: 'font-accent text-3xl leading-tight sm:text-4xl',
  date: 'mt-2 font-semibold text-mostaza',
  window: 'relative min-h-52 overflow-hidden border-t-[6px] border-brasa sm:border-l-[6px] sm:border-t-0',
  media: 'absolute inset-0 size-full object-cover',
  shade: 'absolute inset-0 bg-gradient-to-t from-carbon/80 via-carbon/10 to-transparent',
  clock: 'absolute bottom-3 right-5 text-right',
  time: 'font-display text-5xl leading-none tracking-wide text-brasa tabular-nums drop-shadow sm:text-6xl',
  period: 'ml-1.5 text-2xl sm:text-3xl',
  caption: 'text-xs text-arena',
};

const TICK_MS = 1000;
const hidden = {opacity: 0, y: 16};
const visible = {opacity: 1, y: 0};

function LocalView() {
  const reduce = useReducedMotionConfig();
  if (reduce) {
    return <img src={localPoster} alt="" className={styles.media} />;
  }
  return (
    <video autoPlay muted loop playsInline disablePictureInPicture preload="auto" poster={localPoster} aria-hidden className={styles.media}>
      <source src={localWebm} type="video/webm" />
      <source src={localMp4} type="video/mp4" />
    </video>
  );
}

export function WelcomeCard({name, clockDate}) {
  const [now, setNow] = useState(() => clockDate ?? new Date());

  useEffect(() => {
    if (clockDate) {
      return undefined;
    }
    const timer = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(timer);
  }, [clockDate]);

  const {date, clock, period} = formatDateTime(now);

  return (
    <motion.section initial={hidden} animate={visible} className={styles.board}>
      <span aria-hidden className={styles.coal} />
      <div className={styles.text}>
        <h2 className={styles.greeting}>{greetingFor(name, now)}</h2>
        <p className={styles.date}>{date}</p>
      </div>
      <div className={styles.window}>
        <LocalView />
        <span aria-hidden className={styles.shade} />
        <div className={styles.clock}>
          <time dateTime={now.toISOString()} className={styles.time}>{clock}<span className={styles.period}>{period}</span></time>
          <p className={styles.caption}>Hora del local</p>
        </div>
      </div>
    </motion.section>
  );
}
