import {motion} from 'motion/react';
import {LogOut} from 'lucide-react';
import {Avatar} from '../atoms/Avatar';

const styles = {
  header: 'flex flex-wrap items-center justify-between gap-4',
  title: 'font-display text-5xl leading-none text-carbon',
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

export function Header({title, user, onLogout}) {
  return (
    <header className={styles.header}>
      <motion.h1 key={title} initial={titleHidden} animate={titleVisible} className={styles.title}>
        {title}
      </motion.h1>
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
