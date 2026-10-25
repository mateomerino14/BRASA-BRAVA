import {useId, useRef} from 'react';
import {createPortal} from 'react-dom';
import {AnimatePresence, motion} from 'motion/react';
import {cn} from '../../lib/cn';
import {useDialogFocus} from '../../hooks/useDialogFocus';

const styles = {
  overlay: 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4',
  backdrop: 'absolute inset-0 bg-carbon/40 backdrop-blur-md',
  panel: 'relative max-h-[90dvh] w-full overflow-y-auto rounded-3xl bg-crema p-5 shadow-float sm:p-8',
  sizes: {sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-5xl'},
  cover: '-mx-5 -mt-5 mb-6 sm:-mx-8 sm:-mt-8',
  title: 'font-display text-3xl leading-none text-carbon sm:text-4xl',
  srOnly: 'sr-only',
  description: 'mt-2 text-base text-cafe',
  body: 'mt-6',
  footer: 'mt-6 flex flex-col gap-3',
};

const fadeHidden = {opacity: 0};
const fadeVisible = {opacity: 1};
const panelHidden = {opacity: 0, scale: 0.92, y: 24};
const panelVisible = {opacity: 1, scale: 1, y: 0};
const panelExit = {opacity: 0, scale: 0.95, y: 12};
const panelSpring = {type: 'spring', stiffness: 320, damping: 26};

// Sin X arriba: cada modal cierra con su botón Cerrar o Cancelar del pie (Escape y el fondo también cierran).
// cover: franja opcional de borde a borde arriba del título (por ejemplo la portada de un producto);
// hideTitle deja el título solo para lectores de pantalla cuando la portada ya lo muestra
export function Modal({open, onClose, title, description, size = 'md', cover, hideTitle = false, children, footer}) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef(null);
  useDialogFocus({open, panelRef, onClose});

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className={styles.overlay} initial={fadeHidden} animate={fadeVisible} exit={fadeHidden}>
          <motion.div aria-hidden className={styles.backdrop} onClick={onClose} />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            initial={panelHidden}
            animate={panelVisible}
            exit={panelExit}
            transition={panelSpring}
            className={cn(styles.panel, styles.sizes[size])}
          >
            {cover && <div className={styles.cover}>{cover}</div>}
            <h2 id={titleId} className={cn(styles.title, hideTitle && styles.srOnly)}>
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className={styles.description}>
                {description}
              </p>
            )}
            <div className={styles.body}>{children}</div>
            {footer && <div className={styles.footer}>{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
