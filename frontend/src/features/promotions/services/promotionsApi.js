import {apiRequest} from '../../../lib/apiClient';
import {toQuery} from '../../../lib/query';

const toImageForm = (file) => {
  const form = new FormData();
  form.append('imagen', file);
  return form;
};

export const promotionsApi = {
  list: (params) => apiRequest(`/promotions?${toQuery(params)}`),
  productOptions: () => apiRequest('/promotions/product-options'),
  create: (data) => apiRequest('/promotions', {method: 'POST', body: data}),
  update: (id, data) => apiRequest(`/promotions/${id}`, {method: 'PUT', body: data}),
  setStatus: (id, activo) => apiRequest(`/promotions/${id}/status`, {method: 'PATCH', body: {activo}}),
  uploadImage: (id, file) => apiRequest(`/promotions/${id}/image`, {method: 'PUT', body: toImageForm(file)}),
  removeImage: (id) => apiRequest(`/promotions/${id}/image`, {method: 'DELETE'}),
};
