import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

// Hash de relleno para comparar cuando el usuario no existe y no revelarlo por tiempo de respuesta
export const DUMMY_HASH = bcrypt.hashSync('brasa-brava-dummy', SALT_ROUNDS);

// Genera el hash bcrypt de un texto (contraseña o código)
export const hashSecret = (plain) => bcrypt.hash(plain, SALT_ROUNDS);

// Compara un texto plano contra su hash bcrypt
export const verifySecret = (plain, hash) => bcrypt.compare(plain, hash);
