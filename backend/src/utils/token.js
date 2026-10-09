import jwt from 'jsonwebtoken';

// Firma un JWT con los datos de sesión del usuario
export const signToken = (payload, {secret, expiresIn}) =>
  jwt.sign(payload, secret, {expiresIn});

// Verifica un JWT y devuelve su contenido o lanza si es inválido
export const verifyToken = (token, secret) => jwt.verify(token, secret);
