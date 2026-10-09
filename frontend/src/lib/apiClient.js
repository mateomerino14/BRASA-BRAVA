const API_URL = import.meta.env.VITE_API_URL ?? '/api';
const TOKEN_KEY = 'brasa.token';

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
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

const serializeBody = (body) => {
  if (body === undefined) {
    return undefined;
  }
  return JSON.stringify(body);
};

export const apiRequest = async (path, {method = 'GET', body, auth = true} = {}) => {
  const headers = {accept: 'application/json'};
  if (body !== undefined) {
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
    );
  }
  return data;
};
