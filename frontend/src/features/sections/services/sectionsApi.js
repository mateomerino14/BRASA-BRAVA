import {apiRequest} from '../../../lib/apiClient';
import {toQuery} from '../../../lib/query';

export const sectionsApi = {
  list: (params) => apiRequest(`/sections?${toQuery(params)}`),
  create: (data) => apiRequest('/sections', {method: 'POST', body: data}),
  update: (id, data) => apiRequest(`/sections/${id}`, {method: 'PUT', body: data}),
  setStatus: (id, activo) => apiRequest(`/sections/${id}/status`, {method: 'PATCH', body: {activo}}),
};
