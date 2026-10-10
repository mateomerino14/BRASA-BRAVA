import {apiRequest} from '../../../lib/apiClient';
import {toQuery} from '../../../lib/query';

export const ingredientsApi = {
  list: (params) => apiRequest(`/ingredients?${toQuery(params)}`),
  create: (data) => apiRequest('/ingredients', {method: 'POST', body: data}),
  update: (id, data) => apiRequest(`/ingredients/${id}`, {method: 'PUT', body: data}),
  setStatus: (id, activo) => apiRequest(`/ingredients/${id}/status`, {method: 'PATCH', body: {activo}}),
  addMovement: (id, data) => apiRequest(`/ingredients/${id}/movements`, {method: 'POST', body: data}),
  history: (id, params) => apiRequest(`/ingredients/${id}/movements?${toQuery(params)}`),
};
