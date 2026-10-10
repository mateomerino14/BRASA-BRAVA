import {useEffect, useState} from 'react';
import {useSearchParams} from 'react-router';
import {familyApi} from '../services/familyApi';
import {ALL, PRODUCTS_VIEW, PROMOTIONS_VIEW} from '../constants/family';
import {filterProducts, filterPromotions} from '../utils/family';

const emptyCatalog = {hoy: '', categorias: [], productos: [], promociones: []};

// Catálogo de Familia: vista (productos o promociones), categoría, subcategoría y búsqueda viven en la URL
export function useFamily({api = familyApi} = {}) {
  const [params, setParams] = useSearchParams();
  const [catalog, setCatalog] = useState(emptyCatalog);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState({open: false, kind: null, item: null, loading: false, error: ''});

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await api.catalog();
        if (!cancelled) {
          setCatalog(data);
        }
      }
      catch (problem) {
        if (!cancelled) {
          setError(problem.message);
        }
      }
      finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [api]);

  let view = PRODUCTS_VIEW;
  if (params.get('ver') === PROMOTIONS_VIEW) {
    view = PROMOTIONS_VIEW;
  }
  const filters = {categoria: params.get('categoria') ?? ALL, subcategoria: params.get('sub') ?? ALL, search: params.get('q') ?? ''};

  const update = (changes) => {
    setParams((current) => {
      const next = new URLSearchParams(current);
      for (const [key, value] of Object.entries(changes)) {
        if (value && value !== ALL && value !== PRODUCTS_VIEW) {
          next.set(key, value);
        }
        else {
          next.delete(key);
        }
      }
      return next;
    }, {replace: true});
  };

  const category = catalog.categorias.find((item) => String(item.id) === filters.categoria);

  const openProduct = async (product) => {
    setDetail({open: true, kind: 'producto', item: product, loading: true, error: ''});
    try {
      const result = await api.product(product.id);
      setDetail((current) => ({...current, item: result.producto, loading: false}));
    }
    catch (problem) {
      setDetail((current) => ({...current, loading: false, error: problem.message}));
    }
  };

  return {
    loading,
    error,
    hoy: catalog.hoy,
    view,
    changeView: (value) => update({ver: value}),
    filters,
    categories: catalog.categorias,
    subcategories: category?.subcategorias ?? [],
    changeCategory: (value) => update({categoria: value, sub: null}),
    changeSubcategory: (value) => update({sub: value}),
    changeSearch: (value) => update({q: value}),
    allProducts: catalog.productos,
    allPromotions: catalog.promociones,
    products: filterProducts(catalog.productos, filters),
    promotions: filterPromotions(catalog.promociones, filters.search),
    detail,
    openProduct,
    openPromotion: (promotion) => setDetail({open: true, kind: 'promocion', item: promotion, loading: false, error: ''}),
    closeDetail: () => setDetail((current) => ({...current, open: false})),
  };
}
