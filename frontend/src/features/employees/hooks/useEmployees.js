import {useEffect, useState} from 'react';
import {employeesApi} from '../services/employeesApi';
import {usePaginatedList} from '../../../hooks/usePaginatedList';
import {useToast} from '../../../context/useToast';

const filterDefaults = {idCargo: '', estado: 'todos'};

export function useEmployees({api = employeesApi} = {}) {
  const list = usePaginatedList({fetchPage: api.list, filterDefaults});
  const [roles, setRoles] = useState([]);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    const loadRoles = async () => {
      try {
        const data = await api.roles();
        if (!cancelled) {
          setRoles(data.roles);
        }
      }
      catch (requestError) {
        if (!cancelled) {
          setRoles([]);
          toast.error(requestError.message, 'No se pudieron cargar los cargos');
        }
      }
    };
    loadRoles();
    return () => {
      cancelled = true;
    };
  }, [api, toast]);

  return {
    ...list,
    employees: list.items,
    roles,
    changeRole: (value) => list.changeFilter('idCargo', value),
    changeStatus: (value) => list.changeFilter('estado', value),
  };
}
