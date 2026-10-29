import {categoriesApi} from '../services/categoriesApi';
import {usePaginatedList} from '../../../hooks/usePaginatedList';

const filterDefaults = {estado: 'todos'};

export function useCategories({api = categoriesApi} = {}) {
  const list = usePaginatedList({fetchPage: api.list, filterDefaults});
  return {
    ...list,
    categories: list.items,
    changeStatus: (value) => list.changeFilter('estado', value),
  };
}
