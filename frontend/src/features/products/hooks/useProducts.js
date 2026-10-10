import {useEffect, useState} from 'react';
import {productsApi} from '../services/productsApi';
import {usePaginatedList} from '../../../hooks/usePaginatedList';

const filterDefaults = {idCategoria: '', idSubcategoria: '', estado: 'todos', disponibilidad: 'todos'};

export function useProducts({api = productsApi} = {}) {
  const list = usePaginatedList({fetchPage: api.list, filterDefaults});
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const loadOptions = async () => {
      try {
        const data = await api.options();
        if (!cancelled) {
          setCategories(data.categorias);
        }
      }
      catch {
        if (!cancelled) {
          setCategories([]);
        }
      }
    };
    loadOptions();
    return () => {
      cancelled = true;
    };
  }, [api]);

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
