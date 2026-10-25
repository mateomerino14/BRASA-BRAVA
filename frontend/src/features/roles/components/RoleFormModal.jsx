import {useId} from 'react';
import {Check, House, Info} from 'lucide-react';
import {Modal} from '../../../components/organisms/Modal';
import {Button} from '../../../components/atoms/Button';
import {Input} from '../../../components/atoms/Input';
import {FormField} from '../../../components/molecules/FormField';
import {cn} from '../../../lib/cn';
import {ALL_SCREENS, NAME_MAX_LENGTH, SCREEN_GROUPS} from '../constants/roles';

const styles = {
  form: 'flex flex-col gap-5',
  screens: 'flex flex-col gap-4 border-0 p-0',
  head: 'flex flex-wrap items-baseline justify-between gap-2',
  legend: 'text-base font-semibold text-carbon',
  required: 'text-error',
  counter: 'text-sm text-cafe',
  counterValue: 'font-display text-xl leading-none text-brasa-oscuro',
  group: 'flex flex-col gap-2',
  groupHead: 'flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-cafe after:h-px after:flex-1 after:bg-arena/60',
  groupToggle: 'order-last text-xs font-bold normal-case tracking-normal text-brasa-oscuro transition-colors hover:text-brasa',
  grid: 'grid gap-2 sm:grid-cols-2',
  tile: 'group relative flex cursor-pointer items-center gap-3 rounded-xl border-2 bg-white px-3 py-2.5 transition-[border-color,background-color] duration-200 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brasa/25',
  tileOff: 'border-arena/70 hover:border-brasa/50',
  tileOn: 'border-brasa bg-brasa/5',
  tileFixed: 'cursor-default border-dashed border-arena bg-hueso/60',
  icon: 'inline-flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors',
  iconOff: 'bg-hueso text-cafe',
  iconOn: 'bg-brasa text-white',
  text: 'min-w-0 flex-1 leading-tight',
  label: 'block text-sm font-semibold text-carbon',
  hint: 'block text-xs text-cafe',
  noteIcon: 'mt-0.5 shrink-0',
  check: 'inline-flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
  checkOff: 'border-arena bg-white text-transparent',
  checkOn: 'border-brasa bg-brasa text-white',
  input: 'sr-only',
  error: 'text-sm font-medium text-error',
  note: 'flex items-start gap-2 rounded-xl bg-hueso px-3 py-2.5 text-sm text-cafe',
  actions: 'grid gap-3 sm:grid-cols-2',
};

function ScreenTile({screen, checked, onToggle}) {
  const Icon = screen.icon;
  return (
    <label className={cn(styles.tile, checked ? styles.tileOn : styles.tileOff)}>
      <input type="checkbox" checked={checked} onChange={onToggle} className={styles.input} />
      <span aria-hidden className={cn(styles.icon, checked ? styles.iconOn : styles.iconOff)}>
        <Icon size={18} />
      </span>
      <span className={styles.text}>
        <span className={styles.label}>{screen.label}</span>
        <span className={styles.hint}>{screen.hint}</span>
      </span>
      <span aria-hidden className={cn(styles.check, checked ? styles.checkOn : styles.checkOff)}>
        <Check size={14} strokeWidth={3} />
      </span>
    </label>
  );
}

function HomeTile() {
  return (
    <div className={cn(styles.tile, styles.tileFixed)}>
      <span aria-hidden className={cn(styles.icon, styles.iconOff)}>
        <House size={18} />
      </span>
      <span className={styles.text}>
        <span className={styles.label}>Página principal</span>
        <span className={styles.hint}>La tienen todos los cargos</span>
      </span>
    </div>
  );
}

const employeesNote = (role) => {
  const total = role?.totalEmpleados ?? 0;
  if (total === 1) {
    return 'Este cambio afecta a 1 empleado. Verá sus pantallas nuevas la próxima vez que inicie sesión.';
  }
  if (total > 1) {
    return `Este cambio afecta a ${total} empleados. Verán sus pantallas nuevas la próxima vez que inicien sesión.`;
  }
  return 'Los empleados con este cargo verán sus pantallas la próxima vez que inicien sesión.';
};

export function RoleFormModal({form}) {
  const selected = form.values.pantallas;
  const legendId = useId();
  const errorId = useId();

  return (
    <Modal
      open={form.open}
      onClose={form.close}
      size="lg"
      title={form.isEdit ? 'Modificar cargo' : 'Registrar nuevo cargo'}
      description="Elija las pantallas del sistema a las que entra quien tenga este cargo."
    >
      <form onSubmit={form.submit} noValidate className={styles.form}>
        <FormField label="Nombre del cargo" required error={form.errors.nombre}>
          {(control) => <Input {...control} maxLength={NAME_MAX_LENGTH} placeholder="Bartender" value={form.values.nombre} onChange={(event) => form.setField('nombre', event.target.value)} />}
        </FormField>

        <fieldset className={styles.screens} aria-labelledby={legendId} aria-describedby={form.errors.pantallas ? errorId : undefined}>
          <div className={styles.head}>
            <p id={legendId} className={styles.legend}>
              Pantallas que puede ver<span className={styles.required}> *</span>
            </p>
            <p className={styles.counter} aria-live="polite">
              <span className={styles.counterValue}>{selected.length}</span> de {ALL_SCREENS.length} marcadas
            </p>
          </div>

          <HomeTile />

          {SCREEN_GROUPS.map((group) => {
            const ids = group.screens.map((screen) => screen.id);
            const allChecked = ids.every((id) => selected.includes(id));
            return (
              <div key={group.title} className={styles.group}>
                <p className={styles.groupHead}>
                  {group.title}
                  <button type="button" onClick={() => form.toggleGroup(ids)} className={styles.groupToggle}>
                    {allChecked ? 'Quitar todas' : 'Marcar todas'}
                  </button>
                </p>
                <div className={styles.grid}>
                  {group.screens.map((screen) => (
                    <ScreenTile key={screen.id} screen={screen} checked={selected.includes(screen.id)} onToggle={() => form.toggleScreen(screen.id)} />
                  ))}
                </div>
              </div>
            );
          })}

          {form.errors.pantallas && <p id={errorId} role="alert" className={styles.error}>{form.errors.pantallas}</p>}
        </fieldset>

        {form.isEdit && (
          <p className={styles.note}>
            <Info size={16} aria-hidden className={styles.noteIcon} />
            {employeesNote(form.editing)}
          </p>
        )}

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
