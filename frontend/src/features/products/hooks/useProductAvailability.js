import {useState} from 'react';
import {productsApi} from '../services/productsApi';

const successMessage = (product) => {
  if (product.disponible) {
    return `${product.nombre} vuelve a estar disponible`;
  }
  return `${product.nombre} quedó marcado como agotado`;
};

// Cambio rápido de disponible/agotado, sin confirmación; bloquea el interruptor mientras guarda
export function useProductAvailability({onChanged, onError, api = productsApi} = {}) {
  const [pendingIds, setPendingIds] = useState([]);

  const toggle = async (product) => {
    setPendingIds((ids) => [...ids, product.id]);
    try {
      const {product: updated} = await api.setAvailability(product.id, !product.disponible);
      onChanged?.(successMessage(updated));
    }
    catch (requestError) {
      onError?.(requestError.message);
    }
    setPendingIds((ids) => ids.filter((id) => id !== product.id));
  };

  return {toggle, isPending: (product) => pendingIds.includes(product.id)};
}
