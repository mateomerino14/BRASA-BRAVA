import {apiRequest, imageEndpoints} from '../../../lib/apiClient';
import {toQuery} from '../../../lib/query';

export const employeesApi = {
  list: (params) => apiRequest(`/employees?${toQuery(params)}`),
  create: (data) => apiRequest('/employees', {method: 'POST', body: data}),
  update: (id, data) => apiRequest(`/employees/${id}`, {method: 'PUT', body: data}),
  setStatus: (id, activo) => apiRequest(`/employees/${id}/status`, {method: 'PATCH', body: {activo}}),
  roles: () => apiRequest('/roles'),
  ...imageEndpoints('/employees'),
};
