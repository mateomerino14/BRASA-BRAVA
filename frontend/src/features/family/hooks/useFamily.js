import {useEffect, useState} from 'react';
import {useSearchParams} from 'react-router';
import {familyApi} from '../services/familyApi';
import {ALL, PRODUCTS_VIEW, PROMOTIONS_VIEW} from '../constants/family';
import {filterProducts, filterPromotions} from '../utils/family';
import {useToast} from '../../../context/useToast';

const emptyCatalog = {hoy: '', categorias: [], productos: [], promociones: []};

// Catálogo de Familia: vista (productos o promociones), categoría, subcategoría y búsqueda viven en la URL
export function useFamily({api = familyApi} = {}) {
  const [params, setParams] = useSearchParams();
  const [catalog, setCatalog] = useState(emptyCatalog);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [detail, setDetail] = useState({open: false, kind: null, item: null, loading: false, failed: false});
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await api.catalog();
        if (!cancelled) {
          setCatalog(data);
          setFailed(false);
        }
      }
      catch (problem) {
        if (!cancelled) {
          setFailed(true);
          toast.error(problem.message, 'No se pudo cargar el catálogo');
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
  }, [api, toast, attempt]);

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
    setDetail({open: true, kind: 'producto', item: product, loading: true, failed: false});
    try {
      const result = await api.product(product.id);
      setDetail((current) => ({...current, item: result.producto, loading: false}));
    }
    catch (problem) {
      setDetail((current) => ({...current, loading: false, failed: true}));
      toast.error(problem.message, 'No se pudo cargar la receta');
    }
  };

  // Vuelve a pedir el catálogo después de un error
  const reload = () => {
    setLoading(true);
    setAttempt((current) => current + 1);
  };

  return {
    loading,
    failed,
    reload,
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
    retryProduct: () => openProduct(detail.item),
    openPromotion: (promotion) => setDetail({open: true, kind: 'promocion', item: promotion, loading: false, failed: false}),
    closeDetail: () => setDetail((current) => ({...current, open: false})),
  };
}
