import {promotionsApi} from '../services/promotionsApi';
import {useStatusToggle} from '../../../hooks/useStatusToggle';

const successMessage = ({promotion}) => {
  if (promotion.activa) {
    return `Se reactivó la promoción ${promotion.nombre}`;
  }
  return `Se dio de baja la promoción ${promotion.nombre}`;
};

export function usePromotionStatus({onChanged, api = promotionsApi} = {}) {
  return useStatusToggle({
    request: (promotion) => api.setStatus(promotion.id, !promotion.activa),
    successMessage,
    onChanged,
  });
}
