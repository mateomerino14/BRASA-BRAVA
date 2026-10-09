import {useCallback, useEffect, useState} from 'react';
import {employeesApi} from '../services/employeesApi';
import {NOTICE_DURATION_MS, PAGE_SIZE, SEARCH_DELAY_MS} from '../constants/employees';

const emptyResult = {items: [], total: 0};

export function useEmployees({api = employeesApi} = {}) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [idCargo, setIdCargo] = useState('');
  const [estado, setEstado] = useState('todos');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(emptyResult);
  const [roles, setRoles] = useState([]);
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
    const loadRoles = async () => {
      try {
        const data = await api.roles();
        if (!cancelled) {
          setRoles(data.roles);
        }
      }
      catch {
        if (!cancelled) {
          setRoles([]);
        }
      }
    };
    loadRoles();
    return () => {
      cancelled = true;
    };
  }, [api]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.list({search: debouncedSearch, idCargo, estado, page, pageSize: PAGE_SIZE});
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
  }, [api, debouncedSearch, idCargo, estado, page, reloadKey]);

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

  const changeRole = (value) => {
    setIdCargo(value);
    setPage(1);
  };

  const changeStatus = (value) => {
    setEstado(value);
    setPage(1);
  };

  const reload = useCallback((message) => {
    if (message) {
      setNotice(message);
    }
    setReloadKey((key) => key + 1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  return {
    employees: result.items,
    total: result.total,
    page,
    totalPages,
    roles,
    loading,
    error,
    notice,
    filters: {search, idCargo, estado},
    changeSearch,
    changeRole,
    changeStatus,
    setPage,
    reload,
  };
}
