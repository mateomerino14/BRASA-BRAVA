import {Link} from 'react-router';
import {MODULE_DESCRIPTIONS} from '../constants/moduleDescriptions';

const styles = {
  title: 'mb-1 font-display text-3xl text-carbon',
  list: 'grid lg:grid-cols-2 lg:gap-x-12',
  link: 'group grid grid-cols-[2rem_auto_minmax(1rem,1fr)] items-baseline gap-x-3 border-b border-arena/60 px-1 py-3.5 transition-colors hover:bg-crema/70 focus-visible:bg-crema/70 sm:grid-cols-[2rem_auto_minmax(1rem,1fr)_auto]',
  icon: 'self-center text-brasa transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-110',
  name: 'font-display text-2xl leading-none text-carbon transition-colors group-hover:text-brasa-oscuro',
  dots: 'hidden -translate-y-1 border-b-2 border-dotted border-arena sm:block',
  description: 'col-start-2 col-end-4 text-[13px] text-cafe sm:col-start-auto sm:col-end-auto sm:text-right',
};

export function QuickAccessGrid({items}) {
  return (
    <section aria-labelledby="quick-access-title">
      <h2 id="quick-access-title" className={styles.title}>
        Accesos rápidos
      </h2>
      <ul className={styles.list}>
        {items.map(({to, label, icon: Icon, permission}) => (
          <li key={to}>
            <Link to={to} className={styles.link}>
              <Icon size={22} aria-hidden className={styles.icon} />
              <span className={styles.name}>{label}</span>
              <span aria-hidden className={styles.dots} />
              <span className={styles.description}>{MODULE_DESCRIPTIONS[permission]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
