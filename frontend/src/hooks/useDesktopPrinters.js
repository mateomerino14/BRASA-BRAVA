import {useEffect, useState} from 'react';
import {desktopBridge} from '../lib/desktopPrinting';

const emptyChoice = {cocina: null, caja: null};

// Estado compartido por todas las pantallas: se lee una vez y se avisa a todas cuando cambia
let shared = {loaded: false, printers: emptyChoice};
const listeners = new Set();

const publish = (next) => {
  shared = next;
  listeners.forEach((listener) => listener(next));
};

const load = async () => {
  const bridge = desktopBridge();
  if (!bridge) {
    return;
  }
  try {
    publish({loaded: true, printers: await bridge.getPrinters()});
  }
  catch {
    publish({loaded: true, printers: emptyChoice});
  }
};

// Impresoras elegidas en la app de escritorio para cocina y caja (en el navegador no hay ninguna)
export function useDesktopPrinters() {
  const [state, setState] = useState(shared);
  const isDesktop = Boolean(desktopBridge());

  useEffect(() => {
    listeners.add(setState);
    if (isDesktop && !shared.loaded) {
      load();
    }
    return () => {
      listeners.delete(setState);
    };
  }, [isDesktop]);

  const save = async (choice) => {
    const printers = await desktopBridge().savePrinters(choice);
    publish({loaded: true, printers});
    return printers;
  };

  return {isDesktop, printers: state.printers, save, list: () => desktopBridge().listPrinters()};
}

// Para pruebas: olvida lo leído y vuelve a pedirlo
export const resetDesktopPrinters = () => {
  shared = {loaded: false, printers: emptyChoice};
};
