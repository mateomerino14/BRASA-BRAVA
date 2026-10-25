import {Button} from '../../../components/atoms/Button';
import {Spinner} from '../../../components/atoms/Spinner';
import {ChipTabs} from '../../../components/molecules/ChipTabs';
import {DateInput} from '../../../components/molecules/DateInput';
import {FormField} from '../../../components/molecules/FormField';
import {countText} from '../../../lib/format';
import {DeletionConfirmModal} from '../components/DeletionConfirmModal';
import {DeletionTable} from '../components/DeletionTable';
import {useDeletion} from '../hooks/useDeletion';
import {DELETION_TYPES, EMPTY_TEXT, TYPE_LABELS} from '../constants/deletion';

const styles = {
  page: 'flex flex-col gap-5',
  intro: 'max-w-3xl text-sm text-cafe',
  card: 'flex flex-col gap-4 rounded-3xl border border-arena/40 bg-white p-4 shadow-card sm:p-5',
  range: 'grid gap-4 sm:max-w-xl sm:grid-cols-2',
  tools: 'flex flex-wrap items-center gap-3 text-sm',
  count: 'font-semibold text-carbon',
  link: 'rounded-md px-2 py-1 font-semibold text-brasa-oscuro transition-colors hover:bg-brasa/10',
  loading: 'flex justify-center py-12',
  empty: 'rounded-2xl border border-dashed border-arena bg-white px-4 py-10 text-center text-sm text-cafe',
  footer: 'flex flex-col gap-3 rounded-3xl border border-rojo/30 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between',
  footerText: 'text-sm text-cafe',
};

// Eliminación física (solo el DIRECTORIO): borra para siempre lo dado de baja y todo lo que depende de ello
export function DeletionPage() {
  const deletion = useDeletion();
  const {tipo, rows} = deletion;
  const tabs = DELETION_TYPES.map((value) => ({value, label: TYPE_LABELS[value], count: deletion.selection[value].length, countLabel: countText(deletion.selection[value].length, 'marcado', 'marcados')}));
  return (
    <div className={styles.page}>
      <p className={styles.intro}>
        Borra de la base para siempre registros que ya están dados de baja, junto con lo que depende de ellos (por ejemplo, las ventas de un empleado o las mesas de una sección). Antes de borrar se muestra todo lo que se va. No se puede deshacer.
      </p>
      <section aria-label="Qué eliminar" className={styles.card}>
        <ChipTabs label="Qué eliminar" options={tabs} value={tipo} onChange={deletion.changeTipo} />
        {tipo === 'ventas' && (
          <div className={styles.range}>
            <FormField label="Cobradas desde">{(field) => <DateInput {...field} label="Desde" value={deletion.range.desde} onChange={(desde) => deletion.changeRange({desde})} />}</FormField>
            <FormField label="Hasta">{(field) => <DateInput {...field} label="Hasta" value={deletion.range.hasta} onChange={(hasta) => deletion.changeRange({hasta})} />}</FormField>
          </div>
        )}
        <div className={styles.tools}>
          <span className={styles.count}>{deletion.selected.length} de {rows.length} marcados</span>
          <button type="button" onClick={deletion.markAll} className={styles.link}>Marcar todos</button>
          <button type="button" onClick={deletion.clearMarks} className={styles.link}>Quitar marcas</button>
        </div>
        {deletion.loading && <div className={styles.loading}><Spinner size={28} label="Cargando" /></div>}
        {!deletion.loading && rows.length === 0 && <p className={styles.empty}>{EMPTY_TEXT[tipo]}</p>}
        {!deletion.loading && rows.length > 0 && (
          <DeletionTable tipo={tipo} rows={rows} selected={deletion.selected} onToggle={deletion.toggle} label={TYPE_LABELS[tipo]} />
        )}
      </section>
      <div className={styles.footer}>
        <p className={styles.footerText}>{countText(deletion.total, 'registro marcado', 'registros marcados')} entre todas las pestañas.</p>
        <Button variant="danger" action="remove" disabled={deletion.total === 0} onClick={deletion.openPreview}>
          Eliminar {countText(deletion.total, 'marcado', 'marcados')}
        </Button>
      </div>
      <DeletionConfirmModal deletion={deletion} />
    </div>
  );
}
