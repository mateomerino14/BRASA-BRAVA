import {apiRequest} from '../../../lib/apiClient';
import {toQuery} from '../../../lib/query';

export const rolesApi = {
  list: (params) => apiRequest(`/roles?${toQuery(params)}`),
  create: (data) => apiRequest('/roles', {method: 'POST', body: data}),
  update: (id, data) => apiRequest(`/roles/${id}`, {method: 'PUT', body: data}),
  setStatus: (id, activo) => apiRequest(`/roles/${id}/status`, {method: 'PATCH', body: {activo}}),
};
