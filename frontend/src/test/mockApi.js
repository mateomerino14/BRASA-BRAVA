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
      'cocina',
      'productos',
      'secciones',
      'stock',
      'categorias',
      'promociones',
      'empleados',
    ],
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

const json = (status, body) =>
  Promise.resolve({ok: status < 400, status, json: () => Promise.resolve(body)});

// Los handlers reciben JSON ya parseado o el FormData tal cual (subida de archivos)
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
    'POST /auth/login': ({username, password}) =>
      password === 'Brasa2026'
        ? [
          200,
          {
            token: 'token-de-prueba',
            user: username === 'a.romero' ? USERS.cajero : USERS.admin,
          },
        ]
        : [401, {message: 'Usuario o contraseña incorrectos'}],
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
    const [status, body] = handler(parseBody(options.body), query);
    return json(status, body);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};
