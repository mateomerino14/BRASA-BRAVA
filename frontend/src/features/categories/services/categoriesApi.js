import {apiRequest} from '../../../lib/apiClient';
import {toQuery} from '../../../lib/query';

const toImageForm = (file) => {
  const form = new FormData();
  form.append('imagen', file);
  return form;
};

export const categoriesApi = {
  list: (params) => apiRequest(`/categories?${toQuery(params)}`),
  create: (data) => apiRequest('/categories', {method: 'POST', body: data}),
  update: (id, data) => apiRequest(`/categories/${id}`, {method: 'PUT', body: data}),
  setStatus: (id, activo) => apiRequest(`/categories/${id}/status`, {method: 'PATCH', body: {activo}}),
  uploadImage: (id, file) => apiRequest(`/categories/${id}/image`, {method: 'PUT', body: toImageForm(file)}),
  removeImage: (id) => apiRequest(`/categories/${id}/image`, {method: 'DELETE'}),
};
