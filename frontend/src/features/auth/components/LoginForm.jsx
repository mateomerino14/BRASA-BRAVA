import {AnimatePresence, motion} from 'motion/react';
import {ShieldCheck} from 'lucide-react';
import {Button} from '../../../components/atoms/Button';
import {Input} from '../../../components/atoms/Input';
import {PasswordInput} from '../../../components/atoms/PasswordInput';
import {FormField} from '../../../components/molecules/FormField';
import {Alert} from '../../../components/molecules/Alert';

const styles = {
  form: 'flex w-full flex-col gap-5',
  bannerWrapper: 'overflow-hidden',
  banner: 'flex items-center gap-2 rounded-lg bg-carbon px-4 py-2 text-sm font-semibold text-crema',
  bannerIcon: 'text-brasa',
  passwordBlock: 'flex flex-col gap-2',
  forgot: 'self-end text-base font-medium text-rojo underline-offset-4 transition hover:underline',
  actions: 'grid gap-4 sm:grid-cols-2',
};

const bannerHidden = {opacity: 0, height: 0};
const bannerVisible = {opacity: 1, height: 'auto'};

export function LoginForm({form, onForgotPassword, passwordRef}) {
  const {values, errors, formError, submitting, isDirectorio, setField, submit, toggleDirectorio} = form;

  return (
    <form onSubmit={submit} noValidate className={styles.form}>
      <AnimatePresence initial={false}>
        {isDirectorio && (
          <motion.div initial={bannerHidden} animate={bannerVisible} exit={bannerHidden} className={styles.bannerWrapper}>
            <p className={styles.banner}>
              <ShieldCheck size={18} className={styles.bannerIcon} aria-hidden />
              Modo DIRECTORIO: ingrese la contraseña de administración general.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <FormField label="Usuario" error={errors.username}>
        {(field) => (
          <Input
            {...field}
            autoComplete="username"
            placeholder="Su alias de empleado"
            value={values.username}
            readOnly={isDirectorio}
            onChange={(event) => setField('username', event.target.value)}
          />
        )}
      </FormField>

      <div className={styles.passwordBlock}>
        <FormField label="Contraseña" error={errors.password}>
          {(field) => (
            <PasswordInput
              {...field}
              ref={passwordRef}
              autoComplete="current-password"
              placeholder="••••••••"
              value={values.password}
              onChange={(event) => setField('password', event.target.value)}
            />
          )}
        </FormField>
        {!isDirectorio && (
          <button type="button" onClick={onForgotPassword} className={styles.forgot}>
            ¿Olvidaste tu contraseña?
          </button>
        )}
      </div>

      {formError && <Alert tone="error">{formError}</Alert>}

      <div className={styles.actions}>
        <Button type="submit" variant="dark" size="lg" loading={submitting}>
          Ingresar
        </Button>
        <Button
          type="button"
          size="lg"
          variant={isDirectorio ? 'outline' : 'primary'}
          aria-pressed={isDirectorio}
          onClick={toggleDirectorio}
        >
          {isDirectorio ? 'Modo empleado' : 'Modo directorio'}
        </Button>
      </div>
    </form>
  );
}
