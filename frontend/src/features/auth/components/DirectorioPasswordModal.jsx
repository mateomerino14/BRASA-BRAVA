import {Modal} from '../../../components/organisms/Modal';
import {Button} from '../../../components/atoms/Button';
import {PasswordInput} from '../../../components/atoms/PasswordInput';
import {FormField} from '../../../components/molecules/FormField';

const styles = {
  form: 'flex flex-col gap-5',
  divider: 'h-px bg-arena/60',
  actions: 'grid gap-3 sm:grid-cols-2',
};

function PasswordField({form, field, label, hint, autoComplete}) {
  return (
    <FormField label={label} required hint={hint} error={form.errors[field]}>
      {(control) => (
        <PasswordInput {...control} autoComplete={autoComplete} value={form.values[field]} onChange={(event) => form.setField(field, event.target.value)} />
      )}
    </FormField>
  );
}

export function DirectorioPasswordModal({form, onLogout}) {
  let title = 'Cambiar contraseña';
  let description = 'Contraseña del DIRECTORIO, la cuenta con acceso a todo el sistema.';
  if (form.required) {
    title = 'Elija su contraseña';
    description = 'Es la primera vez que entra con la contraseña inicial. Elija una propia para proteger la cuenta con acceso a todo el sistema; hasta entonces no se puede usar el sistema.';
  }
  return (
    <Modal
      open={form.open}
      onClose={form.close}
      title={title}
      description={description}
    >
      <form onSubmit={form.submit} noValidate className={styles.form}>
        <PasswordField form={form} field="actual" label="Contraseña actual" autoComplete="current-password" />
        <span aria-hidden className={styles.divider} />
        <PasswordField form={form} field="nueva" label="Nueva contraseña" hint="Mínimo 8 caracteres, con letras y números." autoComplete="new-password" />
        <PasswordField form={form} field="confirmacion" label="Repita la nueva contraseña" autoComplete="new-password" />
        <div className={styles.actions}>
          {form.required && (
            <Button variant="outline" action="close" onClick={onLogout} disabled={form.saving}>
              Cerrar sesión
            </Button>
          )}
          {!form.required && (
            <Button variant="outline" action="cancel" onClick={form.close} disabled={form.saving}>
              Cancelar
            </Button>
          )}
          <Button type="submit" action="password" loading={form.saving}>
            Cambiar contraseña
          </Button>
        </div>
      </form>
    </Modal>
  );
}
