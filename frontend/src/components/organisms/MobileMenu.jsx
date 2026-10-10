import {useRef} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {Sidebar} from './Sidebar';
import {useDialogFocus} from '../../hooks/useDialogFocus';

const styles = {
  overlay: 'fixed inset-0 z-40 flex',
  backdrop: 'absolute inset-0 bg-carbon/45 backdrop-blur-sm',
  panel: 'relative h-full',
};

const fadeHidden = {opacity: 0};
const fadeVisible = {opacity: 1};
const panelHidden = {x: '-100%'};
const panelVisible = {x: 0};
const panelSpring = {type: 'spring', stiffness: 360, damping: 34};

// Menú lateral como panel deslizable para celular y tablet; se cierra con Escape, el fondo o la X
export function MobileMenu({open, onClose, items, user, onLogout}) {
  const panelRef = useRef(null);
  useDialogFocus({open, panelRef, onClose, initialFocus: 'a[aria-current="page"], a[href]'});

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="mobile-menu" className={styles.overlay} initial={fadeHidden} animate={fadeVisible} exit={fadeHidden}>
          <motion.div aria-hidden className={styles.backdrop} onClick={onClose} />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            initial={panelHidden}
            animate={panelVisible}
            exit={panelHidden}
            transition={panelSpring}
            className={styles.panel}
          >
            <Sidebar items={items} variant="drawer" onClose={onClose} user={user} onLogout={onLogout} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
