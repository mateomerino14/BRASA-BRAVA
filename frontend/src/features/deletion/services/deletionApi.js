import {apiRequest} from '../../../lib/apiClient';

export const deletionApi = {
  candidates: (tipo, {desde, hasta} = {}) => {
    let query = '';
    if (tipo === 'ventas') {
      query = `?${new URLSearchParams({desde, hasta})}`;
    }
    return apiRequest(`/deletion/candidates/${tipo}${query}`);
  },
  preview: (selection) => apiRequest('/deletion/preview', {method: 'POST', body: selection}),
  execute: (selection, confirmacion) => apiRequest('/deletion/execute', {method: 'POST', body: {...selection, confirmacion}}),
};
