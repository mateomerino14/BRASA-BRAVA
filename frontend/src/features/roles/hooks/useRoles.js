import {rolesApi} from '../services/rolesApi';
import {usePaginatedList} from '../../../hooks/usePaginatedList';

const filterDefaults = {estado: 'todos'};

export function useRoles({api = rolesApi} = {}) {
  const list = usePaginatedList({fetchPage: api.list, filterDefaults});
  return {
    ...list,
    roles: list.items,
    changeStatus: (value) => list.changeFilter('estado', value),
  };
}
