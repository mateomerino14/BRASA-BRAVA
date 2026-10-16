import {useEffect, useState} from 'react';
import {productsApi} from '../services/productsApi';
import {usePaginatedList} from '../../../hooks/usePaginatedList';
import {useToast} from '../../../context/useToast';

const filterDefaults = {idCategoria: '', idSubcategoria: '', estado: 'todos', disponibilidad: 'todos'};

export function useProducts({api = productsApi} = {}) {
  const list = usePaginatedList({fetchPage: api.list, filterDefaults});
  const [categories, setCategories] = useState([]);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    const loadOptions = async () => {
      try {
        const data = await api.options();
        if (!cancelled) {
          setCategories(data.categorias);
        }
      }
      catch (requestError) {
        if (!cancelled) {
          setCategories([]);
          toast.error(requestError.message, 'No se pudieron cargar las categorías');
        }
      }
    };
    loadOptions();
    return () => {
      cancelled = true;
    };
  }, [api, toast]);

  return {
    ...list,
    products: list.items,
    categories,
    // Al cambiar de categoría la subcategoría elegida deja de aplicar
    changeCategory: (value) => list.changeFilters({idCategoria: value, idSubcategoria: ''}),
    changeSubcategory: (value) => list.changeFilter('idSubcategoria', value),
    changeStatus: (value) => list.changeFilter('estado', value),
    changeAvailability: (value) => list.changeFilter('disponibilidad', value),
  };
}
