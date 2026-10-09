import {badRequest} from '../utils/httpError.js';

// Valida req[source] con un esquema Zod y reemplaza el valor por el dato limpio
export const validate =
  (schema, source = 'body') =>
    (req, _res, next) => {
      const result = schema.safeParse(req[source] ?? {});
      if (!result.success) {
        const details = result.error.issues.map((issue) => ({
          campo: issue.path.join('.'),
          mensaje: issue.message,
        }));
        return next(badRequest(details[0]?.mensaje ?? 'Datos inválidos', details));
      }
      req.validated = {...req.validated, [source]: result.data};
      return next();
    };
