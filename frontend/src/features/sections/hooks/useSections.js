import {sectionsApi} from '../services/sectionsApi';
import {usePaginatedList} from '../../../hooks/usePaginatedList';

const filterDefaults = {estado: 'todos'};
const emptySummary = {secciones: 0, mesas: 0, capacidad: 0};

export function useSections({api = sectionsApi} = {}) {
  const list = usePaginatedList({fetchPage: api.list, filterDefaults});
  return {
    ...list,
    sections: list.items,
    summary: list.response.summary ?? emptySummary,
    changeStatus: (value) => list.changeFilter('estado', value),
  };
}
