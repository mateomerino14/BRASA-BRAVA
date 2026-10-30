import {vi} from 'vitest';

export const USERS = {
  admin: {
    id: 4,
    alias: 'admin',
    nombre: 'Marco Vargas',
    cargo: 'Administrador',
    fotoUrl: null,
    isDirectorio: false,
    permissions: [
      'home',
      'familia',
      'caja',
      'productos',
      'secciones',
      'stock',
      'categorias',
      'promociones',
      'empleados',
      'cargos',
      'reportes',
    ],
  },
  directorio: {
    id: 1,
    alias: 'DIRECTORIO',
    nombre: 'DIRECTORIO',
    cargo: 'Directorio',
    fotoUrl: null,
    isDirectorio: true,
    permissions: ['home', 'familia', 'caja', 'administracion', 'productos', 'secciones', 'stock', 'categorias', 'promociones', 'empleados', 'cargos', 'reportes', 'eliminacion'],
  },
  cajero: {
    id: 2,
    alias: 'a.romero',
    nombre: 'Andrea Romero',
    cargo: 'Cajero',
    fotoUrl: null,
    isDirectorio: false,
    permissions: ['home', 'familia', 'caja'],
  },
};

const json = (status, body, file) =>
  Promise.resolve({
    ok: status < 400,
    status,
    json: () => Promise.resolve(body),
    headers: {get: (name) => file?.headers?.[name.toLowerCase()] ?? null},
    blob: () => Promise.resolve(file?.blob ?? new Blob([])),
  });

const parseBody = (body) => {
  if (body === undefined || body instanceof FormData) {
    return body;
  }
  return JSON.parse(body);
};

export const mockApi = (handlers = {}) => {
  const defaults = {
    'GET /auth/login-users': () => [
      200,
      {users: [{alias: 'a.romero', nombre: 'Andrea Romero', cargo: 'Cajero', fotoUrl: null}]},
    ],
    'GET /auth/me': () => [200, {user: USERS.admin}],
    'POST /auth/login': ({username, password}) => {
      if (password !== 'Brasa2026') {
        return [401, {message: 'Usuario o contraseña incorrectos'}];
      }
      let user = USERS.admin;
      if (username === 'a.romero') {
        user = USERS.cajero;
      }
      return [200, {token: 'token-de-prueba', user}];
    },
  };
  const routes = {...defaults, ...handlers};
  const fetchMock = vi.fn((url, options = {}) => {
    const [path, queryString = ''] = url.replace(/^\/api/, '').split('?');
    const key = `${options.method ?? 'GET'} ${path}`;
    const query = Object.fromEntries(new URLSearchParams(queryString));
    const handler = routes[key];
    if (!handler) {
      return json(404, {message: `Sin mock para ${key}`});
    }
    const [status, body, file] = handler(parseBody(options.body), query);
    return json(status, body, file);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};
