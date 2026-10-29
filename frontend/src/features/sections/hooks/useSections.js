import {sectionsApi} from '../services/sectionsApi';
import {usePaginatedList} from '../../../hooks/usePaginatedList';

const filterDefaults = {estado: 'todos'};

export function useSections({api = sectionsApi} = {}) {
  const list = usePaginatedList({fetchPage: api.list, filterDefaults});
  return {
    ...list,
    sections: list.items,
    changeStatus: (value) => list.changeFilter('estado', value),
  };
}
