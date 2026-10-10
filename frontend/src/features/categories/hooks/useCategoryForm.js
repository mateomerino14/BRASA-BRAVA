import {useRef} from 'react';
import {categoriesApi} from '../services/categoriesApi';
import {EMPTY_FORM} from '../constants/categories';
import {toFormValues, toPayload, validateCategory} from '../utils/categoryForm';
import {useEntityForm} from '../../../hooks/useEntityForm';

const MESSAGES = {
  created: (category) => `Se registró la categoría ${category.nombre}`,
  updated: (category) => `Se actualizó la categoría ${category.nombre}`,
  imageFailed: 'La categoría se guardó, pero la imagen no',
};

export function useCategoryForm({onSaved, api = categoriesApi} = {}) {
  const form = useEntityForm({
    api,
    entityKey: 'category',
    emptyValues: EMPTY_FORM,
    toFormValues,
    toPayload,
    validate: validateCategory,
    messages: MESSAGES,
    onSaved,
    withImage: true,
  });
  const nextKey = useRef(0);

  const addSubcategory = (nombre) => {
    nextKey.current += 1;
    form.setField('subcategorias', [...form.values.subcategorias, {key: `nueva-${nextKey.current}`, nombre}]);
  };

  const removeSubcategory = (key) => {
    form.setField('subcategorias', form.values.subcategorias.filter((sub) => sub.key !== key));
  };

  return {...form, addSubcategory, removeSubcategory};
}
