import {ingredientsApi} from '../services/ingredientsApi';
import {usePaginatedList} from '../../../hooks/usePaginatedList';

const filterDefaults = {estado: 'todos'};

export function useIngredients({api = ingredientsApi} = {}) {
  const list = usePaginatedList({fetchPage: api.list, filterDefaults});
  return {
    ...list,
    ingredients: list.items,
    changeStatus: (value) => list.changeFilter('estado', value),
  };
}
