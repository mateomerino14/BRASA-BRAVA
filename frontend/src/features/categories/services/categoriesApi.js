import {apiRequest, imageEndpoints} from '../../../lib/apiClient';
import {toQuery} from '../../../lib/query';

export const categoriesApi = {
  list: (params) => apiRequest(`/categories?${toQuery(params)}`),
  create: (data) => apiRequest('/categories', {method: 'POST', body: data}),
  update: (id, data) => apiRequest(`/categories/${id}`, {method: 'PUT', body: data}),
  setStatus: (id, activo) => apiRequest(`/categories/${id}/status`, {method: 'PATCH', body: {activo}}),
  ...imageEndpoints('/categories'),
};
