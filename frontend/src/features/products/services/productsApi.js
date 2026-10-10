import {apiRequest} from '../../../lib/apiClient';
import {toQuery} from '../../../lib/query';

const toImageForm = (file) => {
  const form = new FormData();
  form.append('imagen', file);
  return form;
};

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
  uploadImage: (id, file) => apiRequest(`/products/${id}/image`, {method: 'PUT', body: toImageForm(file)}),
  removeImage: (id) => apiRequest(`/products/${id}/image`, {method: 'DELETE'}),
};
