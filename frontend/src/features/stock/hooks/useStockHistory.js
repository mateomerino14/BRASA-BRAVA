import {useEffect, useState} from 'react';
import {ingredientsApi} from '../services/ingredientsApi';
import {HISTORY_PAGE_SIZE} from '../constants/stock';

const emptyPage = {items: [], total: 0};

// Historial de movimientos del insumo elegido, de a una página por vez
export function useStockHistory({api = ingredientsApi} = {}) {
  const [target, setTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(emptyPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!target) {
      return undefined;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.history(target.id, {page, pageSize: HISTORY_PAGE_SIZE});
        if (!cancelled) {
          setResult(data);
          setError('');
        }
      }
      catch (requestError) {
        if (!cancelled) {
          setError(requestError.message);
        }
      }
      if (!cancelled) {
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [api, target, page]);

  const open = (ingredient) => {
    setResult(emptyPage);
    setPage(1);
    setTarget(ingredient);
  };

  return {
    target,
    items: result.items,
    total: result.total,
    page,
    totalPages: Math.max(1, Math.ceil(result.total / HISTORY_PAGE_SIZE)),
    loading,
    error,
    open,
    close: () => setTarget(null),
    setPage,
  };
}
