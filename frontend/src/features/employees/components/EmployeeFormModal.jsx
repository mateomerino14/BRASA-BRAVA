import {Modal} from '../../../components/organisms/Modal';
import {Button} from '../../../components/atoms/Button';
import {Input} from '../../../components/atoms/Input';
import {PasswordInput} from '../../../components/atoms/PasswordInput';
import {Select} from '../../../components/atoms/Select';
import {Avatar} from '../../../components/atoms/Avatar';
import {FormField} from '../../../components/molecules/FormField';
import {Alert} from '../../../components/molecules/Alert';

const styles = {
  form: 'flex flex-col gap-5',
  preview: 'flex items-center gap-4 rounded-2xl border border-arena/60 bg-white p-4',
  previewName: 'font-semibold text-carbon',
  previewRole: 'text-xs uppercase tracking-wide text-rojo',
  grid: 'grid gap-4 sm:grid-cols-2',
  actions: 'grid gap-3 sm:grid-cols-2',
};

const previewName = (values) => {
  const fullName = `${values.nombre} ${values.apellido}`.trim();
  if (fullName) {
    return fullName;
  }
  return 'Nuevo empleado';
};

function TextField({form, field, label, required, ...props}) {
  return (
    <FormField label={label} required={required} error={form.errors[field]}>
      {(control) => (
        <Input {...control} {...props} value={form.values[field]} onChange={(event) => form.setField(field, event.target.value)} />
      )}
    </FormField>
  );
}

export function EmployeeFormModal({form, roles}) {
  const roleOptions = roles.map((role) => ({value: String(role.id), label: role.nombre}));
  const roleName = roles.find((role) => String(role.id) === form.values.idCargo)?.nombre ?? 'Sin cargo';

  return (
    <Modal
      open={form.open}
      onClose={form.close}
      size="lg"
      title={form.isEdit ? 'Modificar empleado' : 'Registrar nuevo empleado'}
      description={form.isEdit ? 'Actualice los datos del empleado registrado.' : 'Complete los datos para dar acceso al sistema.'}
    >
      <form onSubmit={form.submit} noValidate className={styles.form}>
        <div className={styles.preview}>
          <Avatar name={previewName(form.values)} size={56} />
          <div>
            <p className={styles.previewName}>{previewName(form.values)}</p>
            <p className={styles.previewRole}>{roleName}</p>
          </div>
        </div>

        <div className={styles.grid}>
          <TextField form={form} field="nombre" label="Nombre" required autoComplete="given-name" />
          <TextField form={form} field="apellido" label="Apellido" required autoComplete="family-name" />
          <TextField form={form} field="ci" label="CI" required placeholder="4920114 LP" />
          <TextField form={form} field="telefono" label="Teléfono" inputMode="numeric" placeholder="71234567" />
          <TextField form={form} field="alias" label="Usuario" required placeholder="c.mendoza" autoComplete="off" />
          <TextField form={form} field="correo" label="Correo" required type="email" placeholder="nombre@brasabrava.bo" />
          <FormField label="Cargo" required error={form.errors.idCargo}>
            {(control) => (
              <Select
                {...control}
                placeholder="Seleccione un cargo"
                options={roleOptions}
                value={form.values.idCargo}
                onChange={(event) => form.setField('idCargo', event.target.value)}
              />
            )}
          </FormField>
          <FormField
            label={form.isEdit ? 'Nueva contraseña' : 'Contraseña inicial'}
            required={!form.isEdit}
            hint={form.isEdit ? 'Déjela vacía para mantener la actual.' : 'Mínimo 8 caracteres, con letras y números.'}
            error={form.errors.contrasena}
          >
            {(control) => (
              <PasswordInput
                {...control}
                autoComplete="new-password"
                value={form.values.contrasena}
                onChange={(event) => form.setField('contrasena', event.target.value)}
              />
            )}
          </FormField>
        </div>

        {form.modalError && <Alert tone="error">{form.modalError}</Alert>}

        <div className={styles.actions}>
          <Button variant="outline" onClick={form.close} disabled={form.saving}>
            Cancelar
          </Button>
          <Button type="submit" loading={form.saving}>
            {form.isEdit ? 'Guardar' : 'Registrar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
