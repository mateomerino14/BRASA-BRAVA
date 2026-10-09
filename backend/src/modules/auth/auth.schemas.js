import {z} from 'zod';

const email = z.string().trim().toLowerCase().email('Ingrese un correo válido');
const code = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'El código debe tener 6 dígitos');

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Ingrese su usuario').max(30),
  password: z.string().min(1, 'Ingrese su contraseña').max(100),
});

export const resetRequestSchema = z.object({email});

export const resetVerifySchema = z.object({email, code});

export const resetConfirmSchema = z.object({
  email,
  code,
  newPassword: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100)
    .regex(/[A-Za-z]/, 'La contraseña debe incluir letras')
    .regex(/\d/, 'La contraseña debe incluir números'),
});
