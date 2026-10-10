import {useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {Sidebar} from '../organisms/Sidebar';
import {MobileMenu} from '../organisms/MobileMenu';
import {Header} from '../organisms/Header';
import {Footer} from '../organisms/Footer';
import {useMediaQuery} from '../../hooks/useMediaQuery';
import {DESKTOP_QUERY} from '../../config/breakpoints';

const styles = {
  screen: 'flex h-dvh flex-col',
  body: 'flex min-h-0 flex-1',
  content: 'flex min-w-0 flex-1 flex-col overflow-y-auto bg-lienzo',
  inner: 'flex flex-1 flex-col gap-6 px-4 py-5 sm:gap-8 sm:px-6 sm:py-6 lg:px-10',
  main: 'flex-1',
};

const pageHidden = {opacity: 0, y: 14};
const pageVisible = {opacity: 1, y: 0};
const pageExit = {opacity: 0, y: -8};
const pageTransition = {duration: 0.25, ease: 'easeOut'};

// Plantilla de las pantallas con sesión: menú fijo en escritorio; en celular o tablet el menú se desliza y el pie se desplaza con el contenido
export function MainLayout({sidebarItems, user, title, onLogout, collapsed, onToggleCollapsed, pageKey, children}) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lastPage, setLastPage] = useState(pageKey);

  // Al navegar a otra pantalla el menú deslizable se cierra solo
  if (pageKey !== lastPage) {
    setLastPage(pageKey);
    setMenuOpen(false);
  }

  let openMenu;
  if (!isDesktop) {
    openMenu = () => setMenuOpen(true);
  }

  return (
    <div className={styles.screen}>
      <div className={styles.body}>
        {isDesktop && <Sidebar items={sidebarItems} collapsed={collapsed} onToggleCollapsed={onToggleCollapsed} />}
        <div className={styles.content}>
          <div className={styles.inner}>
            <Header title={title} user={user} onLogout={onLogout} onOpenMenu={openMenu} menuOpen={menuOpen && !isDesktop} />
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
      <MobileMenu open={menuOpen && !isDesktop} onClose={() => setMenuOpen(false)} items={sidebarItems} user={user} onLogout={onLogout} />
    </div>
  );
}
