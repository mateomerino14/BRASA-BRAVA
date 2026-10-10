import {useState} from 'react';
import {NavLink, useLocation, matchPath} from 'react-router';
import {AnimatePresence, motion} from 'motion/react';
import {ChevronDown, LogOut, PanelLeftClose, PanelLeftOpen, X} from 'lucide-react';
import {Logo} from '../atoms/Logo';
import {Avatar} from '../atoms/Avatar';
import {cn} from '../../lib/cn';

const styles = {
  aside: 'relative flex h-full shrink-0 flex-col overflow-hidden bg-brasa bg-sidebar-glow px-4 py-6',
  drawer: 'w-[280px] max-w-[85vw] shadow-float',
  account: 'mt-4 flex items-center gap-3 rounded-2xl bg-white/15 p-2.5 sm:hidden',
  accountText: 'min-w-0 flex-1 leading-tight text-white',
  accountAlias: 'truncate text-sm font-bold',
  accountRole: 'truncate text-xs uppercase tracking-wide text-white/85',
  accountLogout: 'flex size-10 shrink-0 items-center justify-center rounded-xl bg-rojo text-white shadow-card transition-colors hover:bg-rojo-oscuro',
  closeButton: 'ml-auto flex size-9 shrink-0 items-center justify-center rounded-xl text-white transition hover:rotate-90 hover:bg-white/15 focus-visible:outline-white',
  brand: 'flex items-center gap-3 px-1',
  brandCollapsed: 'justify-center',
  logo: 'shrink-0 ring-2 ring-white/70',
  brandText: 'min-w-0 leading-tight text-white',
  brandName: 'font-display text-2xl tracking-wide',
  brandSubtitle: 'text-xs text-white/85',
  nav: 'mt-8 flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden',
  link: 'group relative flex h-10 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold outline-offset-0 transition-colors duration-200 focus-visible:outline-white',
  linkNested: 'h-9 text-sm',
  linkActive: 'text-brasa',
  linkIdle: 'text-white hover:bg-white/15',
  pill: 'absolute inset-0 rounded-xl bg-crema shadow-pill',
  linkIcon: 'relative shrink-0 transition-transform duration-200 group-hover:scale-110',
  linkLabel: 'relative truncate',
  collapsedGroup: 'flex flex-col gap-1 border-t border-white/20 pt-2',
  groupToggle: 'flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[15px] font-semibold text-white transition-colors hover:bg-white/15 focus-visible:outline-white',
  groupToggleMarked: 'bg-white/15',
  groupIcon: 'shrink-0',
  groupLabel: 'flex-1 text-left',
  groupContent: 'overflow-hidden',
  groupList: 'ml-5 mt-1 flex flex-col gap-1 border-l-2 border-white/30 pl-3',
  collapseButton: 'mt-4 flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white/90 transition hover:bg-white/15 focus-visible:outline-white',
};

const SPRING = {type: 'spring', stiffness: 380, damping: 32};
const expandedWidth = 280;
const collapsedWidth = 84;
const groupClosed = {height: 0, opacity: 0};
const groupOpen = {height: 'auto', opacity: 1};
const groupTransition = {height: SPRING, opacity: {duration: 0.2}};
const listStagger = {visible: {transition: {staggerChildren: 0.04}}};
const itemReveal = {hidden: {x: -10, opacity: 0}, visible: {x: 0, opacity: 1}};

const isRouteActive = (pathname, item) => Boolean(matchPath({path: item.to, end: item.end ?? false}, pathname));

function MenuLink({item, collapsed, nested = false}) {
  const Icon = item.icon;
  const compactNested = nested && !collapsed;

  return (
    <NavLink
      to={item.to}
      end={item.end}
      title={collapsed ? item.label : undefined}
      className={({isActive}) => cn(styles.link, isActive ? styles.linkActive : styles.linkIdle, compactNested && styles.linkNested)}
    >
      {({isActive}) => (
        <>
          {isActive && <motion.span layoutId="sidebar-active-pill" transition={SPRING} className={styles.pill} />}
          <Icon size={compactNested ? 17 : 19} aria-hidden className={styles.linkIcon} />
          {!collapsed && <span className={styles.linkLabel}>{item.label}</span>}
        </>
      )}
    </NavLink>
  );
}

function MenuGroup({item, collapsed}) {
  const {pathname} = useLocation();
  const hasActiveChild = item.children.some((child) => isRouteActive(pathname, child));
  const [open, setOpen] = useState(hasActiveChild);
  const [lastPath, setLastPath] = useState(pathname);
  const Icon = item.icon;
  const contentId = `menu-${item.label}`;

  // Al navegar a una pantalla del grupo, el grupo se abre solo
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (hasActiveChild && !open) {
      setOpen(true);
    }
  }

  if (collapsed) {
    return (
      <div className={styles.collapsedGroup}>
        {item.children.map((child) => <MenuLink key={child.to} item={child} collapsed />)}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={contentId}
        className={cn(styles.groupToggle, hasActiveChild && !open && styles.groupToggleMarked)}
      >
        <Icon size={19} aria-hidden className={styles.groupIcon} />
        <span className={styles.groupLabel}>{item.label}</span>
        <motion.span animate={{rotate: open ? 180 : 0}} transition={SPRING}>
          <ChevronDown size={18} aria-hidden />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={contentId}
            key="content"
            initial={groupClosed}
            animate={groupOpen}
            exit={groupClosed}
            transition={groupTransition}
            className={styles.groupContent}
          >
            <motion.ul className={styles.groupList} initial="hidden" animate="visible" variants={listStagger}>
              {item.children.map((child) => (
                <motion.li key={child.to} variants={itemReveal}>
                  <MenuLink item={child} nested />
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Menú lateral: fijo y contraíble en escritorio ("rail") o panel deslizable en celular y tablet ("drawer")
export function Sidebar({items, collapsed = false, onToggleCollapsed, variant = 'rail', onClose, user, onLogout}) {
  const isDrawer = variant === 'drawer';
  const compact = collapsed && !isDrawer;
  let width;
  if (compact) {
    width = {width: collapsedWidth};
  }
  else if (!isDrawer) {
    width = {width: expandedWidth};
  }

  return (
    <motion.aside
      aria-label="Menú principal"
      animate={width}
      transition={SPRING}
      className={cn(styles.aside, isDrawer && styles.drawer)}
    >
      <div className={cn(styles.brand, compact && styles.brandCollapsed)}>
        <Logo size={44} className={styles.logo} />
        {!compact && (
          <div className={styles.brandText}>
            <p className={styles.brandName}>Brasa Brava</p>
            <p className={styles.brandSubtitle}>Panel de Gestión</p>
          </div>
        )}
        {isDrawer && (
          <button type="button" onClick={onClose} aria-label="Cerrar menú" className={styles.closeButton}>
            <X size={20} aria-hidden />
          </button>
        )}
      </div>

      <nav className={styles.nav}>
        {items.map((item) => {
          if (item.children) {
            return <MenuGroup key={item.label} item={item} collapsed={compact} />;
          }
          return <MenuLink key={item.to} item={item} collapsed={compact} />;
        })}
      </nav>

      {isDrawer && user && (
        <div className={styles.account}>
          <Avatar name={user.nombre} src={user.fotoUrl} size={38} />
          <div className={styles.accountText}>
            <p className={styles.accountAlias}>{user.alias}</p>
            <p className={styles.accountRole}>{user.cargo}</p>
          </div>
          <button type="button" onClick={onLogout} aria-label="Cerrar sesión" className={styles.accountLogout}>
            <LogOut size={18} aria-hidden />
          </button>
        </div>
      )}

      {onToggleCollapsed && !isDrawer && (
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
          className={styles.collapseButton}
        >
          {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
          {!collapsed && <span>Contraer</span>}
        </button>
      )}
    </motion.aside>
  );
}
