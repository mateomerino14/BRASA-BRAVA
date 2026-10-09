import request from 'supertest';

const passwords = {DIRECTORIO: 'Directorio2026'};

// Inicia sesión con un usuario de prueba y devuelve el header de autorización
export const loginAs = async (app, username) => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({username, password: passwords[username] ?? 'Brasa2026'});
  return {authorization: `Bearer ${res.body.token}`, user: res.body.user};
};
