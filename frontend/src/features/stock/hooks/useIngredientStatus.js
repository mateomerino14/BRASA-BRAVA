import {ingredientsApi} from '../services/ingredientsApi';
import {useStatusToggle} from '../../../hooks/useStatusToggle';

const successMessage = ({ingredient}) => {
  if (ingredient.activo) {
    return `Se reactivó el insumo ${ingredient.nombre}`;
  }
  return `Se dio de baja el insumo ${ingredient.nombre}`;
};

export function useIngredientStatus({onChanged, api = ingredientsApi} = {}) {
  return useStatusToggle({
    request: (ingredient) => api.setStatus(ingredient.id, !ingredient.activo),
    successMessage,
    onChanged,
  });
}
