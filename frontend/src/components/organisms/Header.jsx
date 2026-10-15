import {motion} from 'motion/react';
import {LogOut} from 'lucide-react';
import {Avatar} from '../atoms/Avatar';
import {cn} from '../../lib/cn';

const styles = {
  header: 'flex flex-wrap items-center justify-between gap-x-4 gap-y-3',
  heading: 'min-w-0 flex-1',
  title: 'font-display text-5xl leading-none text-carbon',
  marks: 'mt-2.5 flex gap-2.5',
  mark: 'h-1.5 w-11 rounded-full',
  markColors: ['bg-brasa', 'bg-mostaza', 'bg-carbon'],
  actions: 'flex items-center gap-3',
  profile: 'flex items-center gap-3 rounded-xl border-2 border-brasa bg-white py-1.5 pl-1.5 pr-4 shadow-card',
  profileText: 'leading-tight',
  alias: 'text-sm font-bold text-carbon',
  role: 'text-xs font-semibold uppercase tracking-wide text-rojo',
  logout: 'flex h-11 items-center gap-2 rounded-xl bg-rojo px-4 text-sm font-semibold text-white shadow-card transition-colors hover:bg-rojo-oscuro',
};

const titleHidden = {opacity: 0, x: -12};
const titleVisible = {opacity: 1, x: 0};
const hoverLift = {y: -2};
const tapPress = {scale: 0.95};

const markGrow = {hidden: {scaleX: 0}, visible: {scaleX: 1}};
const marksStagger = {visible: {transition: {staggerChildren: 0.08, delayChildren: 0.15}}};

// Encabezado de escritorio: título con las tres marcas de parrilla, usuario y cierre de sesión
export function Header({title, user, onLogout}) {
  return (
    <header className={styles.header}>
      <div className={styles.heading}>
        <motion.h1 key={title} initial={titleHidden} animate={titleVisible} className={styles.title}>
          {title}
        </motion.h1>
        <motion.span key={`marks-${title}`} aria-hidden initial="hidden" animate="visible" variants={marksStagger} className={styles.marks}>
          {styles.markColors.map((color) => (
            <motion.i key={color} variants={markGrow} style={{originX: 0}} className={cn(styles.mark, color)} />
          ))}
        </motion.span>
      </div>
      <div className={styles.actions}>
        {user && (
          <div className={styles.profile}>
            <Avatar name={user.nombre} src={user.fotoUrl} size={34} />
            <div className={styles.profileText}>
              <p className={styles.alias}>{user.alias}</p>
              <p className={styles.role}>{user.cargo}</p>
            </div>
          </div>
        )}
        <motion.button type="button" onClick={onLogout} whileHover={hoverLift} whileTap={tapPress} className={styles.logout}>
          <LogOut size={17} aria-hidden />
          Cerrar sesión
        </motion.button>
      </div>
    </header>
  );
}
