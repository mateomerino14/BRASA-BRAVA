import {categoriesApi} from '../services/categoriesApi';
import {useStatusToggle} from '../../../hooks/useStatusToggle';

const successMessage = ({category}) => {
  if (category.activa) {
    return `Se reactivó la categoría ${category.nombre}`;
  }
  return `Se dio de baja la categoría ${category.nombre}`;
};

export function useCategoryStatus({onChanged, api = categoriesApi} = {}) {
  return useStatusToggle({
    request: (category) => api.setStatus(category.id, !category.activa),
    successMessage,
    onChanged,
  });
}
