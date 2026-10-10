import {AnimatePresence, motion} from 'motion/react';
import {Armchair, Plus, Trash2} from 'lucide-react';
import {Modal} from '../../../components/organisms/Modal';
import {Button} from '../../../components/atoms/Button';
import {Input} from '../../../components/atoms/Input';
import {Textarea} from '../../../components/atoms/Textarea';
import {IconButton} from '../../../components/atoms/IconButton';
import {FormField} from '../../../components/molecules/FormField';
import {Stepper} from '../../../components/molecules/Stepper';
import {Alert} from '../../../components/molecules/Alert';
import {cn} from '../../../lib/cn';
import {DESCRIPTION_MAX_LENGTH, MAX_CAPACITY, MAX_TABLES, MIN_CAPACITY, NAME_MAX_LENGTH, TABLE_NAME_MAX_LENGTH} from '../constants/sections';
import {tableErrorKey} from '../utils/sectionForm';

const styles = {
  form: 'flex flex-col gap-5',
  tablesHeader: 'flex items-end justify-between gap-3',
  tablesTitle: 'text-base font-semibold text-carbon',
  required: 'text-rojo',
  tablesCount: 'text-xs text-cafe',
  grid: 'grid gap-3 sm:grid-cols-2',
  card: 'flex flex-col gap-2 rounded-2xl border bg-white p-3',
  cardNormal: 'border-arena/60',
  cardInvalid: 'border-rojo',
  cardTop: 'flex items-center gap-2',
  icon: 'shrink-0 text-brasa',
  tableName: 'h-10',
  cardBottom: 'flex items-center justify-between gap-2',
  people: 'text-xs text-cafe',
  error: 'text-xs text-rojo',
  generalError: 'text-sm text-rojo',
  actions: 'grid gap-3 sm:grid-cols-2',
};

const cardIn = {opacity: 0, scale: 0.9};
const cardVisible = {opacity: 1, scale: 1};

function TableCard({form, table, index}) {
  const error = form.errors[tableErrorKey(table.key)];
  return (
    <motion.li layout initial={cardIn} animate={cardVisible} exit={cardIn} className={cn(styles.card, error ? styles.cardInvalid : styles.cardNormal)}>
      <div className={styles.cardTop}>
        <Armchair size={18} aria-hidden className={styles.icon} />
        <Input aria-label={`Nombre de la mesa ${index + 1}`} maxLength={TABLE_NAME_MAX_LENGTH} invalid={Boolean(error)} value={table.nombre} onChange={(event) => form.setTable(table.key, 'nombre', event.target.value)} className={styles.tableName} />
        <IconButton icon={Trash2} tone="danger" label={`Quitar ${table.nombre || `mesa ${index + 1}`}`} onClick={() => form.removeTable(table.key)} />
      </div>
      <div className={styles.cardBottom}>
        <span className={styles.people}>Personas</span>
        <Stepper label={`Capacidad de ${table.nombre || `la mesa ${index + 1}`}`} min={MIN_CAPACITY} max={MAX_CAPACITY} value={table.capacidad} onChange={(value) => form.setTable(table.key, 'capacidad', value)} />
      </div>
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </motion.li>
  );
}

export function SectionFormModal({form}) {
  const tables = form.values.mesas;
  const people = tables.reduce((total, table) => total + table.capacidad, 0);

  return (
    <Modal
      open={form.open}
      onClose={form.close}
      size="lg"
      title={form.isEdit ? 'Modificar sección' : 'Registrar nueva sección'}
      description={form.isEdit ? 'Cambie el nombre, agregue, renombre o quite mesas.' : 'Agregue un ambiente del local con sus mesas.'}
    >
      <form onSubmit={form.submit} noValidate className={styles.form}>
        <FormField label="Nombre" required error={form.errors.nombre}>
          {(control) => <Input {...control} maxLength={NAME_MAX_LENGTH} placeholder="Terraza" value={form.values.nombre} onChange={(event) => form.setField('nombre', event.target.value)} />}
        </FormField>
        <FormField label="Descripción" hint="Opcional. Por ejemplo: planta alta, al aire libre.">
          {(control) => <Textarea {...control} maxLength={DESCRIPTION_MAX_LENGTH} placeholder="Breve descripción de la sección" value={form.values.descripcion} onChange={(event) => form.setField('descripcion', event.target.value)} />}
        </FormField>

        <section aria-label="Mesas de la sección" className={styles.form}>
          <div className={styles.tablesHeader}>
            <p className={styles.tablesTitle}>Mesas <span className={styles.required}>*</span></p>
            <span className={styles.tablesCount}>{tables.length} mesas · {people} personas</span>
          </div>
          <ul className={styles.grid}>
            <AnimatePresence initial={false}>
              {tables.map((table, index) => <TableCard key={table.key} form={form} table={table} index={index} />)}
            </AnimatePresence>
          </ul>
          {form.errors.mesas && <p role="alert" className={styles.generalError}>{form.errors.mesas}</p>}
          <Button variant="outline" size="sm" icon={<Plus size={16} aria-hidden />} onClick={form.addTable} disabled={tables.length >= MAX_TABLES}>
            Agregar mesa
          </Button>
        </section>

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
