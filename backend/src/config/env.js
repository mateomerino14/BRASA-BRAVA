import {z} from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z
    .string()
    .min(1)
    .default('postgres://postgres:postgres@localhost:5432/brasa_brava'),
  JWT_SECRET: z.string().min(16).default('dev-only-secret-change-me'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  MAIL_DRIVER: z.enum(['console', 'brevo']).default('console'),
  BREVO_API_KEY: z.string().optional(),
  MAIL_FROM_EMAIL: z.string().email().default('no-reply@brasabrava.bo'),
  MAIL_FROM_NAME: z.string().default('Brasa Brava'),
  RESET_CODE_TTL_MINUTES: z.coerce.number().int().positive().default(10),
  RESET_CODE_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  RATE_LIMIT_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  STATIC_DIR: z.string().optional(),
  UPLOADS_DIR: z.string().min(1).default('uploads'),
});

// Valida las variables de entorno y devuelve la configuración tipada
export const loadConfig = (source = process.env) => {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Variables de entorno inválidas: ${fields}`);
  }
  const config = parsed.data;
  if (config.NODE_ENV === 'production' && config.JWT_SECRET === 'dev-only-secret-change-me') {
    throw new Error('Defina JWT_SECRET para producción');
  }
  if (config.MAIL_DRIVER === 'brevo' && !config.BREVO_API_KEY) {
    throw new Error('MAIL_DRIVER=brevo requiere BREVO_API_KEY');
  }
  return {
    ...config,
    corsOrigins: config.CORS_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  };
};
