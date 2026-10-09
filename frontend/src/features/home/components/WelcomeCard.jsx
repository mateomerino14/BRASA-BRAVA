import {motion} from 'motion/react';
import {LiveClock} from '../../../components/molecules/LiveClock';

const styles = {
  card: 'relative overflow-hidden rounded-3xl border border-arena/50 bg-crema px-8 py-10 text-center shadow-card',
  glowOrange: 'pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-brasa/20 blur-3xl',
  glowMustard: 'pointer-events-none absolute -bottom-24 -left-10 size-64 rounded-full bg-mostaza/25 blur-3xl',
  greeting: 'relative font-accent text-4xl text-carbon sm:text-5xl',
  clock: 'relative mt-5 flex justify-center',
};

const cardHidden = {opacity: 0, y: 16};
const cardVisible = {opacity: 1, y: 0};

const buildGreeting = (name) => {
  const firstName = name?.split(' ')[0];
  if (firstName) {
    return `¡Bienvenido de vuelta, ${firstName}!`;
  }
  return '¡Bienvenido de vuelta!';
};

export function WelcomeCard({name, clockDate}) {
  return (
    <motion.section initial={cardHidden} animate={cardVisible} className={styles.card}>
      <span aria-hidden className={styles.glowOrange} />
      <span aria-hidden className={styles.glowMustard} />
      <h2 className={styles.greeting}>{buildGreeting(name)}</h2>
      <div className={styles.clock}>
        <LiveClock initialDate={clockDate} />
      </div>
    </motion.section>
  );
}
