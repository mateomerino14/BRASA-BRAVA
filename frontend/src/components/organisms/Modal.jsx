import {useEffect, useId, useRef} from 'react';
import {createPortal} from 'react-dom';
import {AnimatePresence, motion} from 'motion/react';
import {X} from 'lucide-react';
import {cn} from '../../lib/cn';

const styles = {
  overlay: 'fixed inset-0 z-50 flex items-center justify-center p-4',
  backdrop: 'absolute inset-0 bg-carbon/40 backdrop-blur-md',
  panel: 'relative max-h-[90dvh] w-full overflow-y-auto rounded-3xl bg-crema p-8 shadow-float',
  sizes: {sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl'},
  close: 'absolute right-4 top-4 rounded-full p-1.5 text-cafe transition hover:rotate-90 hover:bg-hueso hover:text-carbon',
  title: 'pr-8 font-display text-4xl leading-none text-carbon',
  description: 'mt-2 text-base text-cafe',
  body: 'mt-6',
  footer: 'mt-6 flex flex-col gap-3',
};

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select, textarea, a[href], [tabindex]:not([tabindex="-1"])';
const fadeHidden = {opacity: 0};
const fadeVisible = {opacity: 1};
const panelHidden = {opacity: 0, scale: 0.92, y: 24};
const panelVisible = {opacity: 1, scale: 1, y: 0};
const panelExit = {opacity: 0, scale: 0.95, y: 12};
const panelSpring = {type: 'spring', stiffness: 320, damping: 26};

const trapTab = (event, panel) => {
  const items = [...panel.querySelectorAll(FOCUSABLE)];
  if (items.length === 0) {
    return;
  }
  const first = items[0];
  const last = items.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  }
  else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

export function Modal({open, onClose, title, description, size = 'md', children, footer}) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Depende solo de "open" para que escribir dentro del modal no le quite el foco
  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const previous = document.activeElement;
    const panel = panelRef.current;
    if (panel && !panel.contains(document.activeElement)) {
      const firstField = panel.querySelector('input, textarea, select') ?? panel.querySelector(FOCUSABLE);
      firstField?.focus();
    }

    const handleKey = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current?.();
      }
      else if (event.key === 'Tab' && panel) {
        trapTab(event, panel);
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      previous?.focus?.();
    };
  }, [open]);

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
            {onClose && (
              <button type="button" onClick={onClose} aria-label="Cerrar" className={styles.close}>
                <X size={20} />
              </button>
            )}
            <h2 id={titleId} className={styles.title}>
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
