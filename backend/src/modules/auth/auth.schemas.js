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

const newPassword = z
  .string({error: 'Ingrese la nueva contraseña'})
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(100)
  .regex(/[A-Za-z]/, 'La contraseña debe incluir letras')
  .regex(/\d/, 'La contraseña debe incluir números');

export const resetConfirmSchema = z.object({email, code, newPassword});

export const directorioPasswordSchema = z.object({
  actual: z.string({error: 'Ingrese la contraseña actual'}).min(1, 'Ingrese la contraseña actual').max(100),
  nueva: newPassword,
  confirmacion: z.string({error: 'Repita la nueva contraseña'}).min(1, 'Repita la nueva contraseña').max(100),
})
  .refine((data) => data.nueva === data.confirmacion, {message: 'Las contraseñas no coinciden', path: ['confirmacion']})
  .refine((data) => data.nueva !== data.actual, {message: 'La nueva contraseña debe ser distinta de la actual', path: ['nueva']});
