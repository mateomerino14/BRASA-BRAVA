import {apiRequest} from '../../../lib/apiClient';

const toQuery = (params) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== undefined && value !== null) {
      query.set(key, String(value));
    }
  });
  return query.toString();
};

export const employeesApi = {
  list: (params) => apiRequest(`/employees?${toQuery(params)}`),
  create: (data) => apiRequest('/employees', {method: 'POST', body: data}),
  update: (id, data) => apiRequest(`/employees/${id}`, {method: 'PUT', body: data}),
  setStatus: (id, activo) => apiRequest(`/employees/${id}/status`, {method: 'PATCH', body: {activo}}),
  roles: () => apiRequest('/roles'),
};
