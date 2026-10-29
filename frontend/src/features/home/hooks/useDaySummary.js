import {useEffect, useState} from 'react';
import {homeApi} from '../services/homeApi';
import {SUMMARY_REFRESH_MS} from '../constants/summary';

const loadCashier = async (api) => {
  const [floor, today] = await Promise.all([api.floor(), api.todaySales()]);
  return {...today.resumen, mesas: floor.summary.mesas, ocupadas: floor.summary.ocupadas, porCobrar: floor.summary.porCobrar};
};

const loadKitchen = async (api) => {
  const data = await api.kitchen();
  const waiting = data.envios.find((item) => item.estado === 'preparacion') ?? null;
  return {...data.summary, waiting};
};

export function useDaySummary({canCashier, api = homeApi}) {
  const [summary, setSummary] = useState({cashier: null, kitchen: null});
  const [loading, setLoading] = useState(canCashier);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!canCashier) {
      return undefined;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const [cashier, kitchen] = await Promise.all([loadCashier(api), loadKitchen(api)]);
        if (!cancelled) {
          setSummary({cashier, kitchen});
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
    const timer = setInterval(load, SUMMARY_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [api, canCashier]);

  return {...summary, loading, error, now};
}
