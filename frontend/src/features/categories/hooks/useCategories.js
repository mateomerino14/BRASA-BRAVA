import {categoriesApi} from '../services/categoriesApi';
import {usePaginatedList} from '../../../hooks/usePaginatedList';

const initialFilters = {estado: 'todos'};

export function useCategories({api = categoriesApi} = {}) {
  const list = usePaginatedList({fetchPage: api.list, initialFilters});
  return {
    ...list,
    categories: list.items,
    changeStatus: (value) => list.changeFilter('estado', value),
  };
}
