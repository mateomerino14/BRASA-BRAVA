import {rolesApi} from '../services/rolesApi';
import {usePaginatedList} from '../../../hooks/usePaginatedList';

const filterDefaults = {estado: 'todos'};
const emptySummary = {cargos: null, inactivos: null, empleados: null};

export function useRoles({api = rolesApi} = {}) {
  const list = usePaginatedList({fetchPage: api.list, filterDefaults});
  return {
    ...list,
    roles: list.items,
    summary: list.response.summary ?? emptySummary,
    changeStatus: (value) => list.changeFilter('estado', value),
  };
}
