import {apiRequest} from '../../../lib/apiClient';

export const familyApi = {
  catalog: () => apiRequest('/catalog'),
  product: (id) => apiRequest(`/catalog/products/${id}`),
};
