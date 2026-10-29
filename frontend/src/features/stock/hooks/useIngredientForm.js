import {ingredientsApi} from '../services/ingredientsApi';
import {EMPTY_FORM} from '../constants/stock';
import {toFormValues, toPayload, validateIngredient} from '../utils/stockForm';
import {useEntityForm} from '../../../hooks/useEntityForm';

const MESSAGES = {
  created: (ingredient) => `Se registró el insumo ${ingredient.nombre}`,
  updated: (ingredient) => `Se actualizó el insumo ${ingredient.nombre}`,
};

export function useIngredientForm({onSaved, api = ingredientsApi} = {}) {
  return useEntityForm({
    api,
    entityKey: 'ingredient',
    emptyValues: EMPTY_FORM,
    toFormValues,
    toPayload,
    validate: validateIngredient,
    messages: MESSAGES,
    onSaved,
  });
}
