import {useRef} from 'react';
import {motion} from 'motion/react';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {Avatar} from '../atoms/Avatar';
import {cn} from '../../lib/cn';

const styles = {
  section: 'relative flex items-center gap-2 rounded-2xl bg-mostaza px-2 py-3 shadow-card',
  arrow: 'flex size-10 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/20',
  track: 'flex flex-1 snap-x gap-4 overflow-x-auto scroll-smooth px-1 py-1 [scrollbar-width:none]',
  skeleton: 'h-[108px] w-24 shrink-0 animate-pulse rounded-xl bg-white/50',
  empty: 'w-full py-8 text-center text-sm font-semibold text-carbon/80',
  card: 'flex w-24 shrink-0 snap-start flex-col items-center gap-1.5 rounded-xl bg-white px-2 pb-2 pt-3 shadow-card ring-offset-2 ring-offset-mostaza transition-shadow',
  selected: 'ring-4 ring-carbon',
  alias: 'w-full truncate text-xs font-semibold text-carbon',
};

const skeletonCount = 6;
const pageRatio = 0.8;
const staggerSeconds = 0.05;
const cardHidden = {opacity: 0, y: 12};
const cardVisible = {opacity: 1, y: 0};
const hoverLift = {y: -4};
const tapPress = {scale: 0.95};

export function EmployeeCarousel({users, selectedAlias, onSelect, loading = false}) {
  const trackRef = useRef(null);

  const scrollPage = (direction) => {
    const track = trackRef.current;
    track?.scrollBy({left: direction * track.clientWidth * pageRatio, behavior: 'smooth'});
  };

  return (
    <section aria-label="Seleccionar empleado" className={styles.section}>
      <button type="button" aria-label="Anterior" onClick={() => scrollPage(-1)} className={styles.arrow}>
        <ChevronLeft size={30} />
      </button>
      <div ref={trackRef} className={styles.track}>
        {loading && Array.from({length: skeletonCount}, (_, index) => <div key={index} className={styles.skeleton} />)}
        {!loading && users.length === 0 && <p className={styles.empty}>No hay empleados activos todavía</p>}
        {users.map((user, index) => (
          <motion.button
            key={user.alias}
            type="button"
            onClick={() => onSelect(user)}
            aria-pressed={user.alias === selectedAlias}
            initial={cardHidden}
            animate={cardVisible}
            transition={{delay: index * staggerSeconds}}
            whileHover={hoverLift}
            whileTap={tapPress}
            className={cn(styles.card, user.alias === selectedAlias && styles.selected)}
          >
            <Avatar name={user.nombre} src={user.fotoUrl} size={56} />
            <span className={styles.alias}>{user.alias}</span>
          </motion.button>
        ))}
      </div>
      <button type="button" aria-label="Siguiente" onClick={() => scrollPage(1)} className={styles.arrow}>
        <ChevronRight size={30} />
      </button>
    </section>
  );
}
