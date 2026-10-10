import {useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {VISIBLE_SUBCATEGORIES} from '../constants/categories';

const styles = {
  list: 'flex flex-wrap items-center gap-1.5',
  chip: 'whitespace-nowrap rounded-full border border-arena/70 bg-hueso px-2.5 py-0.5 text-xs font-semibold text-carbon',
  toggle: 'whitespace-nowrap rounded-full border border-brasa/50 bg-brasa/10 px-2.5 py-0.5 text-xs font-bold text-brasa transition-colors hover:bg-brasa hover:text-white',
};

const chipIn = {opacity: 0, y: -6, scale: 0.8};
const chipVisible = {opacity: 1, y: 0, scale: 1};
const STAGGER_SECONDS = 0.04;

// Chips de subcategorías: muestra las primeras y despliega el resto con animación
export function SubcategoryChips({categoryName, subcategories}) {
  const [expanded, setExpanded] = useState(false);
  const hidden = subcategories.length - VISIBLE_SUBCATEGORIES;
  let visible = subcategories;
  if (!expanded) {
    visible = subcategories.slice(0, VISIBLE_SUBCATEGORIES);
  }

  return (
    <motion.ul layout aria-label={`Subcategorías de ${categoryName}`} className={styles.list}>
      <AnimatePresence initial={false}>
        {visible.map((sub, index) => (
          <motion.li
            key={sub.id}
            layout
            initial={chipIn}
            animate={chipVisible}
            exit={chipIn}
            transition={{delay: Math.max(0, index - VISIBLE_SUBCATEGORIES) * STAGGER_SECONDS}}
            className={styles.chip}
          >
            {sub.nombre}
          </motion.li>
        ))}
      </AnimatePresence>
      {hidden > 0 && (
        <li>
          <button type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)} className={styles.toggle}>
            {expanded ? 'Ver menos' : `+${hidden} más`}
          </button>
        </li>
      )}
    </motion.ul>
  );
}
