import '@testing-library/jest-dom/vitest';
import {afterEach, vi} from 'vitest';
import {cleanup, configure} from '@testing-library/react';
import {matchesViewport, setViewport} from './viewport';

// Las pantallas se cargan bajo demanda: en CI con cobertura pueden tardar más del segundo por defecto
configure({asyncUtilTimeout: 5000});

// jsdom no implementa estas APIs del navegador que usan motion y el carrusel.
// Por defecto las pruebas simulan pantalla de escritorio; cada prueba puede cambiarlo con setViewport
window.matchMedia = (query) => ({
  matches: matchesViewport(query),
  media: query,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
});
Element.prototype.scrollBy ??= function scrollBy() {};
URL.createObjectURL ??= (file) => `blob:${file.name}`;
URL.revokeObjectURL ??= () => {};

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  setViewport();
});
