import {apiRequest, imageEndpoints} from '../../../lib/apiClient';
import {toQuery} from '../../../lib/query';

export const productsApi = {
  list: (params) => apiRequest(`/products?${toQuery(params)}`),
  options: () => apiRequest('/products/options'),
  create: (data) => apiRequest('/products', {method: 'POST', body: data}),
  update: (id, data) => apiRequest(`/products/${id}`, {method: 'PUT', body: data}),
  setStatus: (id, activo) => apiRequest(`/products/${id}/status`, {method: 'PATCH', body: {activo}}),
  setAvailability: (id, disponible) => apiRequest(`/products/${id}/availability`, {method: 'PATCH', body: {disponible}}),
  recipe: (id) => apiRequest(`/products/${id}/recipe`),
  saveRecipe: (id, ingredientes) => apiRequest(`/products/${id}/recipe`, {method: 'PUT', body: {ingredientes}}),
  recipeOptions: () => apiRequest('/products/recipe-options'),
  ...imageEndpoints('/products'),
};
