import {useRef, useState} from 'react';
import {categoriesApi} from '../services/categoriesApi';
import {EMPTY_FORM} from '../constants/categories';
import {subcategoryErrorKey, toFormValues, toPayload, validateCategory} from '../utils/categoryForm';
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
  const [focusKey, setFocusKey] = useState(null);
  const subcategories = form.values.subcategorias;

  const addSubcategory = () => {
    nextKey.current += 1;
    const key = `nueva-${nextKey.current}`;
    form.setFields({subcategorias: [...subcategories, {key, nombre: ''}]}, ['subcategorias']);
    setFocusKey(key);
  };

  const renameSubcategory = (key, nombre) => {
    const renamed = subcategories.map((sub) => {
      if (sub.key === key) {
        return {...sub, nombre};
      }
      return sub;
    });
    form.setFields({subcategorias: renamed}, [subcategoryErrorKey(key)]);
  };

  const removeSubcategory = (key) => {
    form.setFields({subcategorias: subcategories.filter((sub) => sub.key !== key)}, [subcategoryErrorKey(key)]);
  };

  return {...form, focusKey, addSubcategory, renameSubcategory, removeSubcategory};
}
