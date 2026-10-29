import {productsApi} from '../services/productsApi';
import {useStatusToggle} from '../../../hooks/useStatusToggle';

const successMessage = ({product}) => {
  if (product.activo) {
    return `Se reactivó el producto ${product.nombre}`;
  }
  return `Se dio de baja el producto ${product.nombre}`;
};

export function useProductStatus({onChanged, api = productsApi} = {}) {
  return useStatusToggle({
    request: (product) => api.setStatus(product.id, !product.activo),
    successMessage,
    onChanged,
  });
}
