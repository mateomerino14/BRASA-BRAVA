import {Modal} from '../../../components/organisms/Modal';
import {Button} from '../../../components/atoms/Button';
import {Input} from '../../../components/atoms/Input';
import {PasswordInput} from '../../../components/atoms/PasswordInput';
import {Select} from '../../../components/atoms/Select';
import {FormField} from '../../../components/molecules/FormField';
import {AvatarPicker} from '../../../components/molecules/AvatarPicker';
import {cn} from '../../../lib/cn';

const styles = {
  form: 'flex flex-col gap-5',
  preview: 'flex items-center gap-5 rounded-2xl border border-arena/60 bg-hueso/50 p-4',
  previewText: 'min-w-0',
  previewName: 'truncate font-display text-2xl leading-tight tracking-wide text-carbon',
  role: 'mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide',
  noRole: 'bg-arena/40 text-cafe',
  chosenRole: 'bg-brasa/10 text-brasa-oscuro',
  photoHint: 'mt-2 text-xs text-cafe',
  section: 'flex flex-col gap-3',
  sectionTitle: 'flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-cafe after:h-px after:flex-1 after:bg-arena/60',
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

function TextField({form, field, label, required, hint, ...props}) {
  return (
    <FormField label={label} required={required} hint={hint} error={form.errors[field]}>
      {(control) => (
        <Input {...control} {...props} value={form.values[field]} onChange={(event) => form.setField(field, event.target.value)} />
      )}
    </FormField>
  );
}

export function EmployeeFormModal({form, roles}) {
  const roleOptions = roles.map((role) => ({value: String(role.id), label: role.nombre}));
  const roleName = roles.find((role) => String(role.id) === form.values.idCargo)?.nombre;
  const name = previewName(form.values);
  let aliasHint;
  if (!form.isEdit) {
    aliasHint = 'Se sugiere con el nombre; puede cambiarlo.';
  }

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
          <AvatarPicker name={name} label="Foto del empleado" file={form.image.file} url={form.image.url} onChange={form.changeImage} />
          <div className={styles.previewText}>
            <p className={styles.previewName}>{name}</p>
            <span className={cn(styles.role, roleName ? styles.chosenRole : styles.noRole)}>{roleName ?? 'Sin cargo'}</span>
            <p className={styles.photoHint}>La foto se muestra al iniciar sesión y en la lista de empleados.</p>
          </div>
        </div>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Datos personales</h3>
          <div className={styles.grid}>
            <TextField form={form} field="nombre" label="Nombre" required autoComplete="given-name" />
            <TextField form={form} field="apellido" label="Apellido" required autoComplete="family-name" />
            <TextField form={form} field="ci" label="CI" required placeholder="4920114 LP" />
            <TextField form={form} field="telefono" label="Teléfono" inputMode="numeric" placeholder="71234567" />
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Acceso al sistema</h3>
          <div className={styles.grid}>
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
            <TextField form={form} field="alias" label="Usuario" required hint={aliasHint} placeholder="c.mendoza" autoComplete="off" />
            <TextField form={form} field="correo" label="Correo" required type="email" placeholder="nombre@brasabrava.bo" />
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
        </section>

        <div className={styles.actions}>
          <Button variant="outline" action="cancel" onClick={form.close} disabled={form.saving}>
            Cancelar
          </Button>
          <Button type="submit" action="save" loading={form.saving}>
            {form.isEdit ? 'Guardar' : 'Registrar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
