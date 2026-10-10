import {useCallback, useEffect, useState} from 'react';
import {useSearchParams} from 'react-router';
import {NOTICE_DURATION_MS, PAGE_SIZE, PAGE_SIZE_OPTIONS, SEARCH_DELAY_MS} from '../config/lists';

const emptyResult = {items: [], total: 0};
const SORT_DIRECTIONS = ['asc', 'desc'];
const BASE_DEFAULTS = {search: '', page: '1', pageSize: String(PAGE_SIZE), sort: '', dir: 'asc'};

const toPositiveInt = (value, fallback) => {
  const number = Number(value);
  if (Number.isInteger(number) && number > 0) {
    return number;
  }
  return fallback;
};

const toPageSize = (value) => {
  const size = Number(value);
  if (PAGE_SIZE_OPTIONS.includes(size)) {
    return size;
  }
  return PAGE_SIZE;
};

const toDirection = (value) => {
  if (SORT_DIRECTIONS.includes(value)) {
    return value;
  }
  return 'asc';
};

// Siguiente orden al tocar un encabezado: ascendente → descendente → orden por defecto
const nextSort = (current, key) => {
  if (current.key !== key) {
    return {sort: key, dir: 'asc'};
  }
  if (current.dir === 'asc') {
    return {sort: key, dir: 'desc'};
  }
  return {sort: '', dir: 'asc'};
};

// Estado estándar de una tabla de gestión guardado en la URL: búsqueda con espera, filtros, página, filas por página y orden
export function usePaginatedList({fetchPage, filterDefaults = {}}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaults = {...BASE_DEFAULTS, ...filterDefaults};
  const defaultsKey = JSON.stringify(defaults);
  const read = (key) => searchParams.get(key) ?? defaults[key];

  const urlSearch = read('search');
  const [search, setSearch] = useState(urlSearch);
  const [lastUrlSearch, setLastUrlSearch] = useState(urlSearch);
  const [result, setResult] = useState(emptyResult);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // Si la URL cambia desde afuera (atrás/adelante), el buscador la sigue
  if (urlSearch !== lastUrlSearch) {
    setLastUrlSearch(urlSearch);
    if (search.trim() !== urlSearch) {
      setSearch(urlSearch);
    }
  }

  const filters = Object.fromEntries(Object.keys(filterDefaults).map((key) => [key, read(key)]));
  const page = toPositiveInt(read('page'), 1);
  const pageSize = toPageSize(read('pageSize'));
  const sort = {key: read('sort'), dir: toDirection(read('dir'))};
  const query = {search: urlSearch, ...filters, page, pageSize};
  if (sort.key) {
    query.sort = sort.key;
    query.dir = sort.dir;
  }
  const queryKey = JSON.stringify(query);

  // Escribe cambios en la URL; los valores por defecto no se guardan para mantenerla limpia
  const updateParams = useCallback((changes) => {
    const initial = JSON.parse(defaultsKey);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      Object.entries(changes).forEach(([key, value]) => {
        const text = String(value ?? '');
        if (text === '' || text === initial[key]) {
          next.delete(key);
        }
        else {
          next.set(key, text);
        }
      });
      return next;
    }, {replace: true});
  }, [setSearchParams, defaultsKey]);

  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed === urlSearch) {
      return undefined;
    }
    const timer = setTimeout(() => updateParams({search: trimmed, page: 1}), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search, urlSearch, updateParams]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchPage(JSON.parse(queryKey));
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
  }, [fetchPage, queryKey, reloadKey]);

  useEffect(() => {
    if (!notice && !actionError) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setNotice('');
      setActionError('');
    }, NOTICE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [notice, actionError]);

  // Vuelve a pedir la página actual y, si se indica, muestra un aviso de éxito
  const reload = (message) => {
    if (message) {
      setNotice(message);
      setActionError('');
    }
    setReloadKey((key) => key + 1);
  };

  const hasActiveFilters = Boolean(urlSearch) || Object.entries(filters).some(([key, value]) => value !== filterDefaults[key]);

  // Cambia el orden: sin dirección alterna como el encabezado; con dirección la aplica tal cual
  const changeSort = (key, dir) => {
    if (dir) {
      updateParams({sort: key, dir, page: 1});
    }
    else {
      updateParams({...nextSort(sort, key), page: 1});
    }
  };

  const clearFilters = () => {
    setSearch('');
    updateParams({search: '', page: 1, ...filterDefaults});
  };

  return {
    items: result.items,
    // Respuesta completa, para datos extra del módulo (por ejemplo, el resumen de stock)
    response: result,
    total: result.total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(result.total / pageSize)),
    loading,
    error: error || actionError,
    notice,
    filters: {search, ...filters},
    sort,
    hasActiveFilters,
    changeSearch: setSearch,
    changeFilter: (name, value) => updateParams({[name]: value, page: 1}),
    changeFilters: (changes) => updateParams({...changes, page: 1}),
    setPage: (value) => updateParams({page: value}),
    changePageSize: (value) => updateParams({pageSize: value, page: 1}),
    changeSort,
    clearFilters,
    reload,
    // Muestra por unos segundos el error de una acción rápida (por ejemplo, un interruptor)
    reportError: (message) => {
      setNotice('');
      setActionError(message);
    },
  };
}
