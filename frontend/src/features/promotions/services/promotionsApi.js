import {apiRequest, imageEndpoints} from '../../../lib/apiClient';
import {toQuery} from '../../../lib/query';

export const promotionsApi = {
  list: (params) => apiRequest(`/promotions?${toQuery(params)}`),
  productOptions: () => apiRequest('/promotions/product-options'),
  create: (data) => apiRequest('/promotions', {method: 'POST', body: data}),
  update: (id, data) => apiRequest(`/promotions/${id}`, {method: 'PUT', body: data}),
  setStatus: (id, activo) => apiRequest(`/promotions/${id}/status`, {method: 'PATCH', body: {activo}}),
  ...imageEndpoints('/promotions'),
};
