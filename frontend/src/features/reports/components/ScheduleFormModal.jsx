import {useId} from 'react';
import {Button} from '../../../components/atoms/Button';
import {Input} from '../../../components/atoms/Input';
import {Select} from '../../../components/atoms/Select';
import {TimeInput} from '../../../components/atoms/TimeInput';
import {DayPicker} from '../../../components/molecules/DayPicker';
import {FormField} from '../../../components/molecules/FormField';
import {Modal} from '../../../components/organisms/Modal';
import {REPORT_TYPES} from '../constants/reports';

const styles = {
  form: 'flex flex-col gap-5',
  note: 'rounded-xl bg-hueso px-3 py-2.5 text-sm text-cafe',
  days: 'flex flex-col gap-2',
  daysLabel: 'text-base font-semibold text-carbon',
  required: 'text-error',
  error: 'text-sm font-medium text-error',
  actions: 'grid gap-3 sm:grid-cols-2',
};

export function ScheduleFormModal({schedules}) {
  const {form} = schedules;
  const daysId = useId();
  const submit = (event) => {
    event.preventDefault();
    schedules.save();
  };
  return (
    <Modal
      open={form.open}
      onClose={schedules.closeForm}
      title={form.editing ? 'Modificar envío programado' : 'Nuevo envío programado'}
      description="El reporte sale en PDF adjunto por correo."
    >
      <form noValidate onSubmit={submit} className={styles.form}>
        <FormField label="Correo de destino" required error={form.errors.correo}>
          {(field) => <Input {...field} type="email" placeholder="gerencia@brasabrava.bo" value={form.values.correo} onChange={(event) => schedules.change({correo: event.target.value})} />}
        </FormField>
        <FormField label="Reporte">
          {(field) => <Select {...field} options={REPORT_TYPES} value={form.values.tipo} onChange={(event) => schedules.change({tipo: event.target.value})} />}
        </FormField>
        <div role="group" aria-labelledby={daysId} className={styles.days}>
          <p id={daysId} className={styles.daysLabel}>Días de la semana<span className={styles.required}> *</span></p>
          <DayPicker value={form.values.dias} onChange={(dias) => schedules.change({dias})} />
          {form.errors.dias && <p role="alert" className={styles.error}>{form.errors.dias}</p>}
        </div>
        <FormField label="Hora" required error={form.errors.hora}>
          {(field) => <TimeInput {...field} label="Hora" invalid={Boolean(form.errors.hora)} value={form.values.hora} onChange={(hora) => schedules.change({hora})} />}
        </FormField>
        <p className={styles.note}>Cada envío trae las ventas desde el envío anterior. Si la computadora estaba apagada a esa hora, se envía apenas se encienda el sistema.</p>
        <div className={styles.actions}>
          <Button variant="outline" action="cancel" disabled={form.saving} onClick={schedules.closeForm}>Cancelar</Button>
          <Button type="submit" action="save" loading={form.saving}>Guardar</Button>
        </div>
      </form>
    </Modal>
  );
}
