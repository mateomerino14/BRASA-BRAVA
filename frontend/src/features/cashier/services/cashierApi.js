import {apiRequest} from '../../../lib/apiClient';

export const cashierApi = {
  floor: () => apiRequest('/sales/floor'),
  catalog: () => apiRequest('/sales/catalog'),
  waiters: () => apiRequest('/sales/waiters'),
  table: (idMesa) => apiRequest(`/sales/tables/${idMesa}`),
  addOrder: (idMesa, data) => apiRequest(`/sales/tables/${idMesa}/orders`, {method: 'POST', body: data}),
  checkout: (idMesa, data) => apiRequest(`/sales/tables/${idMesa}/checkout`, {method: 'POST', body: data}),
  receipt: (idVenta) => apiRequest(`/sales/${idVenta}/receipt`),
  todaySales: () => apiRequest('/sales/today'),
  settings: () => apiRequest('/settings'),
  saveSettings: (data) => apiRequest('/settings', {method: 'PUT', body: data}),
};
