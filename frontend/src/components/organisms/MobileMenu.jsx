import {useRef, useState} from 'react';
import {NavLink, matchPath, useLocation} from 'react-router';
import {AnimatePresence, motion} from 'motion/react';
import {ChevronDown, KeyRound, LogOut} from 'lucide-react';
import {Avatar} from '../atoms/Avatar';
import {MobileTopBar} from './MobileTopBar';
import {useDialogFocus} from '../../hooks/useDialogFocus';
import {cn} from '../../lib/cn';

const styles = {
  overlay: 'fixed inset-0 z-50 flex flex-col',
  blind: 'relative flex min-h-0 flex-1 flex-col bg-carbon text-crema',
  list: 'min-h-0 flex-1 overflow-y-auto',
  slat: 'flex h-16 w-full items-center gap-4 border-b border-crema/10 px-6 font-display text-[26px] leading-none transition-colors focus-visible:outline-white',
  slatIdle: 'text-crema hover:bg-white/5',
  slatActive: 'bg-brasa text-white',
  slatIcon: 'shrink-0 text-brasa',
  slatIconActive: 'shrink-0 text-white',
  chevron: 'ml-auto',
  sub: 'overflow-hidden bg-black/25',
  subSlat: 'h-12 pl-16 text-[21px]',
  account: 'flex items-center gap-3 border-t border-crema/15 px-6 pb-6 pt-4',
  avatar: 'shrink-0 rounded-full ring-2 ring-mostaza',
  accountText: 'min-w-0 flex-1 leading-tight',
  alias: 'truncate text-sm font-bold',
  role: 'truncate text-xs font-bold uppercase tracking-wide text-mostaza',
  password: 'flex size-11 shrink-0 items-center justify-center rounded-xl border border-crema/30 text-crema transition-colors hover:bg-crema/10',
  logout: 'flex items-center gap-2 rounded-xl bg-rojo px-3.5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rojo-oscuro',
  stripes: 'h-2.5 shrink-0 bg-[repeating-linear-gradient(90deg,var(--color-brasa)_0_18px,var(--color-mostaza)_18px_36px)]',
};

const rolledUp = {clipPath: 'inset(0 0 100% 0)'};
const rolledDown = {clipPath: 'inset(0 0 0% 0)'};
const rollTransition = {duration: 0.42, ease: [0.22, 1, 0.36, 1]};
const slatStagger = {visible: {transition: {staggerChildren: 0.045, delayChildren: 0.08}}};
const slatDrop = {hidden: {y: -14, opacity: 0}, visible: {y: 0, opacity: 1}};
const subClosed = {height: 0};
const subOpen = {height: 'auto'};

const isRouteActive = (pathname, item) => Boolean(matchPath({path: item.to, end: item.end ?? false}, pathname));

function Slat({item, nested = false}) {
  const Icon = item.icon;
  return (
    <NavLink to={item.to} end={item.end} className={({isActive}) => cn(styles.slat, nested && styles.subSlat, isActive ? styles.slatActive : styles.slatIdle)}>
      {({isActive}) => (
        <>
          <Icon size={nested ? 19 : 22} aria-hidden className={isActive ? styles.slatIconActive : styles.slatIcon} />
          {item.label}
        </>
      )}
    </NavLink>
  );
}

function SlatGroup({item}) {
  const {pathname} = useLocation();
  const [open, setOpen] = useState(() => item.children.some((child) => isRouteActive(pathname, child)));
  const Icon = item.icon;
  return (
    <>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className={cn(styles.slat, styles.slatIdle)}>
        <Icon size={22} aria-hidden className={styles.slatIcon} />
        {item.label}
        <motion.span animate={{rotate: open ? 180 : 0}} className={styles.chevron}>
          <ChevronDown size={20} aria-hidden />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={subClosed} animate={subOpen} exit={subClosed} className={styles.sub}>
            {item.children.map((child) => <Slat key={child.to} item={child} nested />)}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Menú de celular y tablet tipo persiana: baja desde la barra naranja; se cierra con Escape, la X o al navegar
export function MobileMenu({open, onClose, items, user, onLogout, onChangePassword, title}) {
  const panelRef = useRef(null);
  useDialogFocus({open, panelRef, onClose, initialFocus: 'a[aria-current="page"], a[href]'});

  return (
    <AnimatePresence>
      {open && (
        <div key="mobile-menu" ref={panelRef} role="dialog" aria-modal="true" aria-label="Menú de navegación" className={styles.overlay}>
          <MobileTopBar title={title} open onToggle={onClose} titleAs="p" />
          <motion.div initial={rolledUp} animate={rolledDown} exit={rolledUp} transition={rollTransition} className={styles.blind}>
            <motion.nav initial="hidden" animate="visible" variants={slatStagger} className={styles.list}>
              {items.map((item) => (
                <motion.div key={item.to ?? item.label} variants={slatDrop}>
                  {item.children && <SlatGroup item={item} />}
                  {!item.children && <Slat item={item} />}
                </motion.div>
              ))}
            </motion.nav>
            {user && (
              <div className={styles.account}>
                <span className={styles.avatar}><Avatar name={user.nombre} src={user.fotoUrl} size={40} /></span>
                <div className={styles.accountText}>
                  <p className={styles.alias}>{user.alias}</p>
                  <p className={styles.role}>{user.cargo}</p>
                </div>
                {onChangePassword && (
                  <button type="button" onClick={onChangePassword} aria-label="Cambiar contraseña" className={styles.password}>
                    <KeyRound size={18} aria-hidden />
                  </button>
                )}
                <button type="button" onClick={onLogout} aria-label="Cerrar sesión" className={styles.logout}>
                  <LogOut size={17} aria-hidden />
                  Salir
                </button>
              </div>
            )}
            <span aria-hidden className={styles.stripes} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
