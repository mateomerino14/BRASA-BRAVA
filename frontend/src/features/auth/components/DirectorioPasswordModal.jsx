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

export function DirectorioPasswordModal({form}) {
  return (
    <Modal
      closeButton={false}
      open={form.open}
      onClose={form.close}
      title="Cambiar contraseña"
      description="Contraseña del DIRECTORIO, la cuenta con acceso a todo el sistema."
    >
      <form onSubmit={form.submit} noValidate className={styles.form}>
        <PasswordField form={form} field="actual" label="Contraseña actual" autoComplete="current-password" />
        <span aria-hidden className={styles.divider} />
        <PasswordField form={form} field="nueva" label="Nueva contraseña" hint="Mínimo 8 caracteres, con letras y números." autoComplete="new-password" />
        <PasswordField form={form} field="confirmacion" label="Repita la nueva contraseña" autoComplete="new-password" />
        <div className={styles.actions}>
          <Button variant="outline" onClick={form.close} disabled={form.saving}>
            Cancelar
          </Button>
          <Button type="submit" loading={form.saving}>
            Cambiar contraseña
          </Button>
        </div>
      </form>
    </Modal>
  );
}
