import {useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';

const styles = {
  list: 'flex flex-wrap items-center gap-1.5',
  chip: 'whitespace-nowrap rounded-full border border-arena/70 bg-hueso px-2.5 py-0.5 text-xs font-semibold text-carbon',
  toggle: 'whitespace-nowrap rounded-full border border-brasa/50 bg-brasa/10 px-2.5 py-0.5 text-xs font-bold text-brasa transition-colors hover:bg-brasa hover:text-white',
};

const chipIn = {opacity: 0, y: -6, scale: 0.8};
const chipVisible = {opacity: 1, y: 0, scale: 1};
const STAGGER_SECONDS = 0.04;
const DEFAULT_VISIBLE = 3;

// Lista de chips que muestra los primeros y despliega el resto con "+N más" y entrada escalonada
export function ChipList({label, items, visible = DEFAULT_VISIBLE}) {
  const [expanded, setExpanded] = useState(false);
  const hidden = items.length - visible;
  let shown = items;
  if (!expanded) {
    shown = items.slice(0, visible);
  }

  return (
    <motion.ul layout aria-label={label} className={styles.list}>
      <AnimatePresence initial={false}>
        {shown.map((item, index) => (
          <motion.li
            key={item.id}
            layout
            initial={chipIn}
            animate={chipVisible}
            exit={chipIn}
            transition={{delay: Math.max(0, index - visible) * STAGGER_SECONDS}}
            className={styles.chip}
          >
            {item.label}
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
