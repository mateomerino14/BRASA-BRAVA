import {apiRequest} from '../../../lib/apiClient';

export const authApi = {
  login: (username, password) =>
    apiRequest('/auth/login', {method: 'POST', body: {username, password}, auth: false}),
  me: () => apiRequest('/auth/me'),
  loginUsers: () => apiRequest('/auth/login-users', {auth: false}),
  requestResetCode: (email) =>
    apiRequest('/auth/password-reset/request', {method: 'POST', body: {email}, auth: false}),
  verifyResetCode: (email, code) =>
    apiRequest('/auth/password-reset/verify', {
      method: 'POST',
      body: {email, code},
      auth: false,
    }),
  confirmPasswordReset: (email, code, newPassword) =>
    apiRequest('/auth/password-reset/confirm', {
      method: 'POST',
      body: {email, code, newPassword},
      auth: false,
    }),
};
