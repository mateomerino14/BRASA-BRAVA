import {useCallback, useSyncExternalStore} from 'react';

// Indica si la ventana cumple una media query y se actualiza al redimensionar
export function useMediaQuery(query) {
  const subscribe = useCallback((notify) => {
    const media = window.matchMedia(query);
    media.addEventListener('change', notify);
    return () => media.removeEventListener('change', notify);
  }, [query]);
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => true);
}
