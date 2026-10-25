import {Eye, FileText} from 'lucide-react';
import {Button} from '../../../components/atoms/Button';
import {Select} from '../../../components/atoms/Select';
import {DateInput} from '../../../components/molecules/DateInput';
import {FormField} from '../../../components/molecules/FormField';
import {SegmentedControl} from '../../../components/molecules/SegmentedControl';
import {ALL_EMPLOYEES, DIRECTORIO_FILTER} from '../constants/reports';
import {periodShortcuts} from '../utils/reports';

const styles = {
  card: 'flex flex-col gap-4 rounded-3xl border border-arena/40 bg-white p-4 shadow-card sm:p-5',
  type: 'sm:max-w-md',
  grid: 'grid gap-4 md:grid-cols-[1fr_1fr_1.3fr_auto] md:items-end',
  shortcuts: 'flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-cafe',
  shortcut: 'rounded-md px-2 py-1 font-semibold text-brasa-oscuro transition-colors hover:bg-brasa/10',
};

const TYPE_OPTIONS = [
  {value: 'resumen', label: 'Resumen de ventas', icon: FileText},
  {value: 'detalle', label: 'Ventas detalladas', icon: Eye},
];

const employeeOptions = (employees) => [
  {value: ALL_EMPLOYEES, label: 'Todos los empleados'},
  {value: DIRECTORIO_FILTER, label: 'DIRECTORIO'},
  ...employees.map((item) => {
    let label = `${item.nombre} (${item.alias})`;
    if (!item.activo) {
      label = `${label} · de baja`;
    }
    return {value: String(item.id), label};
  }),
];

// Tipo de reporte, período (con atajos) y empleado
export function ReportFilters({reports}) {
  const {filters, errors} = reports;
  return (
    <section aria-label="Filtros del reporte" className={styles.card}>
      <SegmentedControl label="Tipo de reporte" options={TYPE_OPTIONS} value={filters.tipo} onChange={reports.changeType} className={styles.type} />
      <div className={styles.grid}>
        <FormField label="Desde">
          {(field) => <DateInput {...field} label="Desde" value={filters.desde} onChange={(desde) => reports.change({desde})} />}
        </FormField>
        <FormField label="Hasta" error={errors.hasta}>
          {(field) => <DateInput {...field} label="Hasta" invalid={Boolean(errors.hasta)} value={filters.hasta} onChange={(hasta) => reports.change({hasta})} />}
        </FormField>
        <FormField label="Empleado">
          {(field) => <Select {...field} options={employeeOptions(reports.employees)} value={filters.empleado} onChange={(event) => reports.change({empleado: event.target.value})} />}
        </FormField>
        <Button action="report" loading={reports.loading} onClick={reports.generate}>Generar</Button>
      </div>
      <p className={styles.shortcuts}>
        Empleado: ventas que registró, agregó o cobró. Atajos:
        {periodShortcuts().map((period) => (
          <button key={period.label} type="button" onClick={() => reports.applyPeriod(period)} className={styles.shortcut}>{period.label}</button>
        ))}
      </p>
    </section>
  );
}
