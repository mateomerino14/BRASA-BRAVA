const API_URL = import.meta.env.VITE_API_URL ?? '/api';
const TOKEN_KEY = 'brasa.token';

export class ApiError extends Error {
  constructor(status, message, details, body = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.body = body;
  }
}

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

let onUnauthorized = () => {};

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

const isFormData = (body) => typeof FormData !== 'undefined' && body instanceof FormData;

const serializeBody = (body) => {
  if (body === undefined || isFormData(body)) {
    return body;
  }
  return JSON.stringify(body);
};

export const resolveAssetUrl = (url) => {
  if (!url || !/^https?:\/\//.test(API_URL)) {
    return url;
  }
  return new URL(url, API_URL).toString();
};

export const apiRequest = async (path, {method = 'GET', body, auth = true} = {}) => {
  const headers = {accept: 'application/json'};
  if (body !== undefined && !isFormData(body)) {
    headers['content-type'] = 'application/json';
  }
  const token = tokenStorage.get();
  if (auth && token) {
    headers.authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: serializeBody(body),
    });
  }
  catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && auth && token) {
      onUnauthorized();
    }
    throw new ApiError(
      response.status,
      data.message ?? 'Ocurrió un error inesperado',
      data.details,
      data,
    );
  }
  return data;
};

export const apiDownload = async (path) => {
  const headers = {};
  const token = tokenStorage.get();
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {headers});
  }
  catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor');
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(response.status, data.message ?? 'Ocurrió un error inesperado', data.details, data);
  }
  const disposition = response.headers.get('content-disposition') ?? '';
  const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'reporte.pdf';
  return {blob: await response.blob(), filename};
};

export const saveFile = ({blob, filename}) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

const toImageForm = (file) => {
  const form = new FormData();
  form.append('imagen', file);
  return form;
};

export const imageEndpoints = (resource) => ({
  uploadImage: (id, file) => apiRequest(`${resource}/${id}/image`, {method: 'PUT', body: toImageForm(file)}),
  removeImage: (id) => apiRequest(`${resource}/${id}/image`, {method: 'DELETE'}),
});
