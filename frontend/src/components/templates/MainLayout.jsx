import {AnimatePresence, motion} from 'motion/react';
import {Sidebar} from '../organisms/Sidebar';
import {Header} from '../organisms/Header';
import {Footer} from '../organisms/Footer';

const styles = {
  screen: 'flex h-dvh flex-col',
  body: 'flex min-h-0 flex-1',
  content: 'flex min-w-0 flex-1 flex-col overflow-y-auto bg-lienzo',
  inner: 'flex flex-1 flex-col gap-8 px-6 py-6 lg:px-10',
  main: 'flex-1',
};

const pageHidden = {opacity: 0, y: 14};
const pageVisible = {opacity: 1, y: 0};
const pageExit = {opacity: 0, y: -8};
const pageTransition = {duration: 0.25, ease: 'easeOut'};

export function MainLayout({sidebarItems, user, title, onLogout, collapsed, onToggleCollapsed, pageKey, children}) {
  return (
    <div className={styles.screen}>
      <div className={styles.body}>
        <Sidebar items={sidebarItems} collapsed={collapsed} onToggleCollapsed={onToggleCollapsed} />
        <div className={styles.content}>
          <div className={styles.inner}>
            <Header title={title} user={user} onLogout={onLogout} />
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
        </div>
      </div>
      <Footer />
    </div>
  );
}
