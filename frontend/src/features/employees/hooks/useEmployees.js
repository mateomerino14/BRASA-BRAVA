import {useEffect, useState} from 'react';
import {employeesApi} from '../services/employeesApi';
import {usePaginatedList} from '../../../hooks/usePaginatedList';

const initialFilters = {idCargo: '', estado: 'todos'};

export function useEmployees({api = employeesApi} = {}) {
  const list = usePaginatedList({fetchPage: api.list, initialFilters});
  const [roles, setRoles] = useState([]);

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

  return {
    ...list,
    employees: list.items,
    roles,
    changeRole: (value) => list.changeFilter('idCargo', value),
    changeStatus: (value) => list.changeFilter('estado', value),
  };
}
