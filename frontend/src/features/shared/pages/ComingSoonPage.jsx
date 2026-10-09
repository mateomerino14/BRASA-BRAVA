import {motion} from 'motion/react';
import {Hammer} from 'lucide-react';

const styles = {
  section: 'flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-arena bg-white px-6 py-20 text-center',
  icon: 'flex size-16 items-center justify-center rounded-2xl bg-brasa/10 text-brasa',
  title: 'font-display text-4xl text-carbon',
  text: 'max-w-md text-cafe',
};

const hammerSwing = {rotate: [0, -18, 0]};
const swingTransition = {duration: 1.2, repeat: Infinity, repeatDelay: 1.2};

export function ComingSoonPage({title}) {
  return (
    <section className={styles.section}>
      <motion.span animate={hammerSwing} transition={swingTransition} className={styles.icon}>
        <Hammer size={30} aria-hidden />
      </motion.span>
      <h2 className={styles.title}>{title} en construcción</h2>
      <p className={styles.text}>
        Este módulo se implementará en las siguientes entregas. El diseño ya está definido en el prototipo de Figma.
      </p>
    </section>
  );
}
