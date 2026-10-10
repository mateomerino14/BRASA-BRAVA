import {productsApi} from '../services/productsApi';
import {EMPTY_FORM} from '../constants/products';
import {toFormValues, toPayload, validateProduct} from '../utils/productForm';
import {useEntityForm} from '../../../hooks/useEntityForm';

const MESSAGES = {
  created: (product) => `Se registró el producto ${product.nombre}`,
  updated: (product) => `Se actualizó el producto ${product.nombre}`,
  imageFailed: 'El producto se guardó, pero la foto no',
};

export function useProductForm({onSaved, categories = [], api = productsApi} = {}) {
  const form = useEntityForm({
    api,
    entityKey: 'product',
    emptyValues: EMPTY_FORM,
    toFormValues,
    toPayload,
    validate: validateProduct,
    messages: MESSAGES,
    onSaved,
    withImage: true,
  });

  // Al elegir categoría se reinicia la subcategoría; si solo tiene una, se elige sola
  const changeCategory = (idCategoria) => {
    const category = categories.find((item) => String(item.id) === idCategoria);
    let idSubcategoria = '';
    if (category?.subcategorias.length === 1) {
      idSubcategoria = String(category.subcategorias[0].id);
    }
    form.setFields({idCategoria, idSubcategoria});
  };

  return {...form, changeCategory};
}
