import {useEffect, useRef} from 'react';

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select, textarea, a[href], [tabindex]:not([tabindex="-1"])';

// Paneles abiertos en orden: con un modal encima de otro, solo el de arriba responde al teclado
const openPanels = [];
const isTop = (panel) => openPanels.at(-1) === panel;

// Mantiene el Tab dentro del panel: del último salta al primero y viceversa
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

// Foco accesible de un panel modal: enfoca al abrir, atrapa el Tab, cierra con Escape y devuelve el foco al cerrar
export function useDialogFocus({open, panelRef, onClose, initialFocus = 'input, textarea, select'}) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Depende solo de "open" para que escribir dentro del panel no le quite el foco
  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const previous = document.activeElement;
    const panel = panelRef.current;
    if (panel && !panel.contains(document.activeElement)) {
      const target = panel.querySelector(initialFocus) ?? panel.querySelector(FOCUSABLE);
      target?.focus();
    }

    openPanels.push(panel);
    const handleKey = (event) => {
      if (!isTop(panel)) {
        return;
      }
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
      openPanels.splice(openPanels.indexOf(panel), 1);
      previous?.focus?.();
    };
  }, [open, panelRef, initialFocus]);
}
