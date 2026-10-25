import '@testing-library/jest-dom/vitest';
import {afterEach, vi} from 'vitest';
import {cleanup, configure} from '@testing-library/react';
import {matchesViewport, setViewport} from './viewport';

configure({asyncUtilTimeout: 5000});

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
