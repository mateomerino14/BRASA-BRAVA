import {apiRequest} from '../../../lib/apiClient';

export const homeApi = {
  floor: () => apiRequest('/sales/floor'),
  todaySales: () => apiRequest('/sales/today'),
  kitchen: () => apiRequest('/kitchen/orders'),
};
