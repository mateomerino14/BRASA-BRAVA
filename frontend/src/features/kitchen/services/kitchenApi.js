import {apiRequest} from '../../../lib/apiClient';

export const kitchenApi = {
  orders: () => apiRequest('/kitchen/orders'),
  markLine: (id, accion) => apiRequest(`/kitchen/lines/${id}`, {method: 'PATCH', body: {accion}}),
  markShipment: (idVenta, envio, accion) => apiRequest(`/kitchen/shipments/${idVenta}/${envio}`, {method: 'PATCH', body: {accion}}),
};
