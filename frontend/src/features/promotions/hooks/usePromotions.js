import {useEffect, useState} from 'react';
import {promotionsApi} from '../services/promotionsApi';
import {usePaginatedList} from '../../../hooks/usePaginatedList';

const filterDefaults = {estado: 'todos', tipo: 'todos', vigencia: 'todos'};
const emptySummary = {vigentes: 0, programadas: 0, vencidas: 0};

export function usePromotions({api = promotionsApi} = {}) {
  const list = usePaginatedList({fetchPage: api.list, filterDefaults});
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await api.productOptions();
        if (!cancelled) {
          setProducts(data.productos);
        }
      }
      catch {
        if (!cancelled) {
          setProducts([]);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [api]);

  return {
    ...list,
    promotions: list.items,
    products,
    summary: list.response.summary ?? emptySummary,
    // Fecha de hoy según el servidor (zona horaria del local)
    today: list.response.hoy,
    changeStatus: (value) => list.changeFilter('estado', value),
    changeType: (value) => list.changeFilter('tipo', value),
    changeVigencia: (value) => list.changeFilter('vigencia', value),
  };
}
