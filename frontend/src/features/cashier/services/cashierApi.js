import {apiRequest} from '../../../lib/apiClient';

export const cashierApi = {
  floor: () => apiRequest('/sales/floor'),
  catalog: () => apiRequest('/sales/catalog'),
  waiters: () => apiRequest('/sales/waiters'),
  table: (idMesa) => apiRequest(`/sales/tables/${idMesa}`),
  addOrder: (idMesa, data) => apiRequest(`/sales/tables/${idMesa}/orders`, {method: 'POST', body: data}),
};
