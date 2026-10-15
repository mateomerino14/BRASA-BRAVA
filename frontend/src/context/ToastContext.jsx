import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {AnimatePresence} from 'motion/react';
import {Toast} from '../components/molecules/Toast';
import {ToastContext} from './toastContextValue';

const styles = {
  viewport: 'pointer-events-none fixed right-4 top-4 z-[70] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3',
};

const VISIBLE_MS = 5000;
const MAX_TOASTS = 3;

// Avisos emergentes estándar: errores de una operación (servidor, red) y confirmaciones breves
export function ToastProvider({children}) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const clear = useCallback(() => {
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current.clear();
    setToasts([]);
  }, []);

  const show = useCallback((tone, message, title) => {
    const id = nextId.current;
    nextId.current += 1;
    setToasts((current) => {
      const others = current.filter((toast) => toast.message !== message && (!title || toast.title !== title));
      return [...others, {id, tone, message, title}].slice(-MAX_TOASTS);
    });
    timers.current.set(id, setTimeout(() => dismiss(id), VISIBLE_MS));
  }, [dismiss]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => clearTimeout(timer));
  }, []);

  const value = useMemo(() => ({
    error: (message, title) => show('error', message, title),
    success: (message, title) => show('success', message, title),
    dismiss,
    clear,
  }), [show, dismiss, clear]);

  return (
    <ToastContext value={value}>
      {children}
      {createPortal(
        <div className={styles.viewport}>
          <AnimatePresence initial={false}>
            {toasts.map((toast) => (
              <Toast key={toast.id} tone={toast.tone} title={toast.title} message={toast.message} duration={VISIBLE_MS} onClose={() => dismiss(toast.id)} />
            ))}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastContext>
  );
}
