import {Router} from 'express';
import {z} from 'zod';
import {validate} from '../../middlewares/validate.js';
import {authenticate, authorize} from '../../middlewares/auth.js';

const TAX_LINK = 'enlace_impuestos';
const URL_MAX = 300;

const settingsSchema = z.object({
  enlaceImpuestos: z.string({error: 'Ingrese el enlace'}).trim().max(URL_MAX, 'El enlace es demasiado largo')
    .refine((value) => /^https?:\/\/\S+$/i.test(value), 'Ingrese un enlace que empiece con http:// o https://'),
});

// Lee los ajustes del local que usa la interfaz
const readSettings = async (db) => {
  const {rows} = await db.query('SELECT valor FROM configuracion WHERE clave = $1', [TAX_LINK]);
  return {enlaceImpuestos: rows[0]?.valor ?? ''};
};

// Declara /api/settings: cualquier sesión los lee; solo quien tiene Administración los cambia
export const createSettingsRouter = ({db, config}) => {
  const router = Router();
  router.use(authenticate(config.JWT_SECRET));

  // Devuelve los ajustes del local
  router.get('/', async (_req, res) => res.json(await readSettings(db)));

  // Cambia el enlace a la página de impuestos
  router.put('/', authorize('administracion'), validate(settingsSchema), async (req, res) => {
    const {enlaceImpuestos} = req.validated.body;
    const {rowCount} = await db.query('UPDATE configuracion SET valor = $2 WHERE clave = $1', [TAX_LINK, enlaceImpuestos]);
    if (rowCount === 0) {
      await db.query('INSERT INTO configuracion (clave, valor) VALUES ($1, $2)', [TAX_LINK, enlaceImpuestos]);
    }
    res.json(await readSettings(db));
  });

  return router;
};
