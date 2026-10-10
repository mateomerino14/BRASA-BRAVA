import {useRef} from 'react';
import {promotionsApi} from '../services/promotionsApi';
import {emptyPromotion, productErrorKey, toFormValues, toPayload, validatePromotion} from '../utils/promotionForm';
import {useEntityForm} from '../../../hooks/useEntityForm';

const MESSAGES = {
  created: (promotion) => `Se registró la promoción ${promotion.nombre}`,
  updated: (promotion) => `Se actualizó la promoción ${promotion.nombre}`,
  imageFailed: 'La promoción se guardó, pero la foto no',
};

// Fecha local de hoy en el navegador, por si el listado todavía no trajo la del servidor
const browserToday = () => new Date().toLocaleDateString('en-CA');

// Productos activos más los de la promoción editada (pueden estar de baja), para mostrar nombre y precio
const indexProducts = (products, editing) => {
  const byId = new Map(products.map((item) => [String(item.id), {...item, activo: true}]));
  for (const item of editing?.productos ?? []) {
    if (!byId.has(String(item.idProducto))) {
      byId.set(String(item.idProducto), {id: item.idProducto, nombre: item.nombre, precio: item.precio, activo: item.activo});
    }
  }
  return byId;
};

export function usePromotionForm({onSaved, today, products = [], api = promotionsApi} = {}) {
  const form = useEntityForm({
    api,
    entityKey: 'promotion',
    emptyValues: emptyPromotion(today ?? browserToday()),
    toFormValues,
    toPayload,
    validate: (values, {editing}) => validatePromotion(values, {productsById: indexProducts(products, editing)}),
    messages: MESSAGES,
    onSaved,
    withImage: true,
  });
  const productsById = indexProducts(products, form.editing);
  const nextKey = useRef(0);
  const rows = form.values.productos;
  // Repetidos y mínimo del combo dependen de todas las filas: al cambiar una se limpian los avisos de todas
  const rowErrors = ['productos', 'valor', ...rows.map((row) => productErrorKey(row.key))];

  const addProduct = () => {
    nextKey.current += 1;
    form.setFields({productos: [...rows, {key: `nuevo-${nextKey.current}`, idProducto: '', cantidad: 1}]}, rowErrors);
  };

  const removeProduct = (key) => {
    form.setFields({productos: rows.filter((row) => row.key !== key)}, rowErrors);
  };

  const setProduct = (key, field, value) => {
    form.setFields({
      productos: rows.map((row) => {
        if (row.key === key) {
          return {...row, [field]: value};
        }
        return row;
      }),
    }, rowErrors);
  };

  // Al cambiar de tipo el valor anterior deja de tener sentido (Bs o %)
  const changeType = (tipo) => {
    if (tipo !== form.values.tipo) {
      form.setFields({tipo, valor: ''});
    }
  };

  return {...form, productsById, addProduct, removeProduct, setProduct, changeType};
}
