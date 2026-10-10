import {z} from 'zod';
import {listQuerySchema as baseListQuery} from '../../utils/listQuery.js';

const minPasswordLength = 8;

const text = (label, max) => z.string({error: `Ingrese ${label}`}).trim().min(1, `Ingrese ${label}`).max(max, `${label} es demasiado largo`);

const password = z
  .string()
  .min(minPasswordLength, `La contraseña debe tener al menos ${minPasswordLength} caracteres`)
  .max(100)
  .regex(/[A-Za-z]/, 'La contraseña debe incluir letras')
  .regex(/\d/, 'La contraseña debe incluir números');

const employeeFields = {
  nombre: text('el nombre', 60),
  apellido: text('el apellido', 60),
  ci: text('el CI', 20).regex(/^[0-9]{5,10}(\s?[A-Z]{2,4})?$/i, 'Ingrese un CI válido (ej. 4920114 LP)').transform((value) => value.toUpperCase()),
  alias: text('el usuario', 30).toLowerCase().regex(/^[a-z0-9._]{3,30}$/, 'El usuario solo admite letras, números, punto y guion bajo (mínimo 3)'),
  correo: z.string().trim().toLowerCase().email('Ingrese un correo válido').max(120),
  telefono: z.string().trim().regex(/^[0-9]{7,8}$/, 'Ingrese un teléfono de 7 u 8 dígitos').optional().or(z.literal('')).transform((value) => value || null),
  idCargo: z.coerce.number({error: 'Seleccione un cargo'}).int().positive('Seleccione un cargo'),
};

export const createEmployeeSchema = z.object({...employeeFields, contrasena: password});

export const updateEmployeeSchema = z.object({...employeeFields, contrasena: password.optional().or(z.literal('')).transform((value) => value || null)});

export const statusSchema = z.object({activo: z.boolean({error: 'Indique el estado'})});

export const idParamSchema = z.object({id: z.coerce.number().int().positive('Empleado inválido')});

// Columnas por las que se puede ordenar el listado
export const EMPLOYEE_SORT_KEYS = ['nombre', 'ci', 'cargo', 'usuario', 'estado'];

export const listQuerySchema = baseListQuery(EMPLOYEE_SORT_KEYS, {
  idCargo: z.coerce.number().int().positive().optional(),
});
