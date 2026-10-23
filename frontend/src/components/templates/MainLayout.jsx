import {useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {Sidebar} from '../organisms/Sidebar';
import {MobileMenu} from '../organisms/MobileMenu';
import {Header} from '../organisms/Header';
import {MobileTopBar} from '../organisms/MobileTopBar';
import {Footer} from '../organisms/Footer';
import {useMediaQuery} from '../../hooks/useMediaQuery';
import {DESKTOP_QUERY} from '../../config/breakpoints';

const styles = {
  screen: 'flex h-dvh flex-col',
  body: 'flex min-h-0 flex-1',
  content: 'flex min-w-0 flex-1 flex-col overflow-y-auto bg-lienzo',
  inner: 'flex flex-1 flex-col gap-6 px-4 py-5 sm:gap-8 sm:px-6 sm:py-6 lg:px-10',
  main: 'flex-1',
  topBar: 'sticky top-0 z-30',
};

const pageHidden = {opacity: 0, y: 14};
const pageVisible = {opacity: 1, y: 0};
const pageExit = {opacity: 0, y: -8};
const pageTransition = {duration: 0.25, ease: 'easeOut'};

// Plantilla de las pantallas con sesión: menú fijo en escritorio; en celular o tablet, barra naranja con menú tipo persiana
export function MainLayout({sidebarItems, user, title, onLogout, onChangePassword, collapsed, onToggleCollapsed, pageKey, children}) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lastPage, setLastPage] = useState(pageKey);

  // Al navegar a otra pantalla la persiana se cierra sola
  if (pageKey !== lastPage) {
    setLastPage(pageKey);
    setMenuOpen(false);
  }

  // En celular la persiana se cierra antes de abrir el modal de contraseña
  let changePasswordFromMenu;
  if (onChangePassword) {
    changePasswordFromMenu = () => {
      setMenuOpen(false);
      onChangePassword();
    };
  }

  return (
    <div className={styles.screen}>
      <div className={styles.body}>
        {isDesktop && <Sidebar items={sidebarItems} collapsed={collapsed} onToggleCollapsed={onToggleCollapsed} />}
        <div className={styles.content}>
          {!isDesktop && (
            <div className={styles.topBar}>
              <MobileTopBar title={title} expanded={menuOpen} onToggle={() => setMenuOpen(true)} />
            </div>
          )}
          <div className={styles.inner}>
            {isDesktop && <Header title={title} user={user} onLogout={onLogout} onChangePassword={onChangePassword} />}
            <AnimatePresence mode="wait">
              <motion.main
                key={pageKey}
                initial={pageHidden}
                animate={pageVisible}
                exit={pageExit}
                transition={pageTransition}
                className={styles.main}
              >
                {children}
              </motion.main>
            </AnimatePresence>
          </div>
          {!isDesktop && <Footer />}
        </div>
      </div>
      {isDesktop && <Footer />}
      <MobileMenu open={menuOpen && !isDesktop} onClose={() => setMenuOpen(false)} items={sidebarItems} user={user} onLogout={onLogout} onChangePassword={changePasswordFromMenu} title={title} />
    </div>
  );
}
