import {useCallback, useEffect, useState} from 'react';
import {cashierApi} from '../services/cashierApi';
import {FLOOR_REFRESH_MS} from '../constants/cashier';

const emptyFloor = {secciones: [], summary: {mesas: 0, ocupadas: 0, libres: 0, porCobrar: 0}};

// Mesas por sección: se recargan solas cada cierto tiempo para ver lo que registran otras cajas
export function useFloor({api = cashierApi, sectionId, onSectionChange}) {
  const [floor, setFloor] = useState(emptyFloor);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await api.floor();
        if (!cancelled) {
          setFloor(data);
          setError('');
        }
      }
      catch (problem) {
        if (!cancelled) {
          setError(problem.message);
        }
      }
      finally {
        if (!cancelled) {
          setLoading(false);
          setNow(Date.now());
        }
      }
    };
    load();
    const timer = setInterval(load, FLOOR_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [api, version]);

  // Vuelve a leer las mesas ya (después de enviar, marcar listos o cobrar)
  const reload = useCallback(() => setVersion((current) => current + 1), []);

  let section = floor.secciones.find((item) => String(item.id) === String(sectionId));
  if (!section) {
    section = floor.secciones[0] ?? null;
  }

  return {
    sections: floor.secciones,
    summary: floor.summary,
    section,
    selectSection: onSectionChange,
    loading,
    error,
    now,
    reload,
  };
}
