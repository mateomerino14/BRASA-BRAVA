import {z} from 'zod';
import {ALIAS_MAX_LENGTH, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH} from '../../utils/limits.js';

const email = z.string().trim().toLowerCase().email('Ingrese un correo válido');
const code = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'El código debe tener 6 dígitos');

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Ingrese su usuario').max(ALIAS_MAX_LENGTH),
  password: z.string().min(1, 'Ingrese su contraseña').max(PASSWORD_MAX_LENGTH),
});

export const resetRequestSchema = z.object({email});

export const resetVerifySchema = z.object({email, code});

const newPassword = z
  .string({error: 'Ingrese la nueva contraseña'})
  .min(PASSWORD_MIN_LENGTH, `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`)
  .max(PASSWORD_MAX_LENGTH)
  .regex(/[A-Za-z]/, 'La contraseña debe incluir letras')
  .regex(/\d/, 'La contraseña debe incluir números');

export const resetConfirmSchema = z.object({email, code, newPassword});

export const directorioPasswordSchema = z.object({
  actual: z.string({error: 'Ingrese la contraseña actual'}).min(1, 'Ingrese la contraseña actual').max(PASSWORD_MAX_LENGTH),
  nueva: newPassword,
  confirmacion: z.string({error: 'Repita la nueva contraseña'}).min(1, 'Repita la nueva contraseña').max(PASSWORD_MAX_LENGTH),
})
  .refine((data) => data.nueva === data.confirmacion, {message: 'Las contraseñas no coinciden', path: ['confirmacion']})
  .refine((data) => data.nueva !== data.actual, {message: 'La nueva contraseña debe ser distinta de la actual', path: ['nueva']});
