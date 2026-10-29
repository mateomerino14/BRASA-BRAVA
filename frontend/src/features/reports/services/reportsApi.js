import {apiDownload, apiRequest} from '../../../lib/apiClient';
import {reportQuery} from '../utils/reports';

export const reportsApi = {
  employees: () => apiRequest('/reports/employees'),
  report: (filters) => apiRequest(`/reports/sales?${reportQuery(filters)}`),
  pdf: (filters) => apiDownload(`/reports/sales.pdf?${reportQuery(filters)}`),
  email: (filters, correo) => apiRequest('/reports/sales/email', {method: 'POST', body: {...filters, correo}}),
  schedules: () => apiRequest('/reports/schedules'),
  createSchedule: (data) => apiRequest('/reports/schedules', {method: 'POST', body: data}),
  updateSchedule: (id, data) => apiRequest(`/reports/schedules/${id}`, {method: 'PUT', body: data}),
  setScheduleStatus: (id, activo) => apiRequest(`/reports/schedules/${id}/status`, {method: 'PATCH', body: {activo}}),
  deleteSchedule: (id) => apiRequest(`/reports/schedules/${id}`, {method: 'DELETE'}),
  sendSchedule: (id) => apiRequest(`/reports/schedules/${id}/send`, {method: 'POST'}),
};
