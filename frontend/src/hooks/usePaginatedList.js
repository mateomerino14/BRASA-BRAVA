import {useCallback, useEffect, useState} from 'react';
import {NOTICE_DURATION_MS, PAGE_SIZE, SEARCH_DELAY_MS} from '../config/lists';

const emptyResult = {items: [], total: 0};

// Estado de una tabla paginada: búsqueda con debounce, filtros, página, recarga y aviso temporal
export function usePaginatedList({fetchPage, initialFilters = {}, pageSize = PAGE_SIZE}) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(emptyResult);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchPage({search: debouncedSearch, ...filters, page, pageSize});
        if (!cancelled) {
          setResult(data);
          setError('');
        }
      }
      catch (requestError) {
        if (!cancelled) {
          setResult(emptyResult);
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
  }, [fetchPage, debouncedSearch, filters, page, pageSize, reloadKey]);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }
    const timer = setTimeout(() => setNotice(''), NOTICE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  const changeSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const changeFilter = (name, value) => {
    setFilters((current) => ({...current, [name]: value}));
    setPage(1);
  };

  const reload = useCallback((message) => {
    if (message) {
      setNotice(message);
    }
    setReloadKey((key) => key + 1);
  }, []);

  return {
    items: result.items,
    total: result.total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(result.total / pageSize)),
    loading,
    error,
    notice,
    filters: {search, ...filters},
    changeSearch,
    changeFilter,
    setPage,
    reload,
  };
}
