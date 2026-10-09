import {Link} from 'react-router';
import {motion} from 'motion/react';
import {ArrowUpRight} from 'lucide-react';
import {MODULE_DESCRIPTIONS} from '../constants/moduleDescriptions';

const styles = {
  title: 'mb-4 font-display text-3xl text-carbon',
  grid: 'grid gap-4 sm:grid-cols-2 xl:grid-cols-4',
  card: 'group flex h-full flex-col gap-4 rounded-2xl border border-arena/50 bg-white p-5 shadow-card transition-shadow hover:shadow-float',
  top: 'flex items-start justify-between',
  iconBox: 'flex size-12 items-center justify-center rounded-xl bg-brasa/10 text-brasa transition-colors group-hover:bg-brasa group-hover:text-white',
  arrow: 'text-arena transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brasa',
  label: 'font-display text-2xl leading-none text-carbon',
  description: 'mt-1 text-sm text-cafe',
};

const gridStagger = {visible: {transition: {staggerChildren: 0.06, delayChildren: 0.15}}};
const cardReveal = {hidden: {opacity: 0, y: 18}, visible: {opacity: 1, y: 0}};
const hoverLift = {y: -6};
const cardSpring = {type: 'spring', stiffness: 300, damping: 20};

export function QuickAccessGrid({items}) {
  return (
    <section aria-labelledby="quick-access-title">
      <h2 id="quick-access-title" className={styles.title}>
        Accesos rápidos
      </h2>
      <motion.ul initial="hidden" animate="visible" variants={gridStagger} className={styles.grid}>
        {items.map(({to, label, icon: Icon, permission}) => (
          <motion.li key={to} variants={cardReveal} whileHover={hoverLift} transition={cardSpring}>
            <Link to={to} className={styles.card}>
              <div className={styles.top}>
                <span className={styles.iconBox}>
                  <Icon size={24} aria-hidden />
                </span>
                <ArrowUpRight size={20} aria-hidden className={styles.arrow} />
              </div>
              <div>
                <p className={styles.label}>{label}</p>
                <p className={styles.description}>{MODULE_DESCRIPTIONS[permission]}</p>
              </div>
            </Link>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}
