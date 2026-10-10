import {ingredientsApi} from '../services/ingredientsApi';
import {usePaginatedList} from '../../../hooks/usePaginatedList';

const filterDefaults = {estado: 'todos', nivel: 'todos'};
const emptySummary = {total: 0, bajo: 0, sinStock: 0};

export function useIngredients({api = ingredientsApi} = {}) {
  const list = usePaginatedList({fetchPage: api.list, filterDefaults});
  return {
    ...list,
    ingredients: list.items,
    summary: list.response.summary ?? emptySummary,
    changeStatus: (value) => list.changeFilter('estado', value),
    changeLevel: (value) => list.changeFilter('nivel', value),
  };
}
