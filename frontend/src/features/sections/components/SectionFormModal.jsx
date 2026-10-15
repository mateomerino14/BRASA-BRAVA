import {AnimatePresence, motion} from 'motion/react';
import {Plus, X} from 'lucide-react';
import {Modal} from '../../../components/organisms/Modal';
import {Button} from '../../../components/atoms/Button';
import {Input} from '../../../components/atoms/Input';
import {Textarea} from '../../../components/atoms/Textarea';
import {FormField} from '../../../components/molecules/FormField';
import {Stepper} from '../../../components/molecules/Stepper';
import {cn} from '../../../lib/cn';
import {DESCRIPTION_MAX_LENGTH, MAX_CAPACITY, MAX_DRAWN_SEATS, MAX_TABLES, MIN_CAPACITY, NAME_MAX_LENGTH, TABLE_NAME_MAX_LENGTH} from '../constants/sections';
import {tableErrorKey} from '../utils/sectionForm';

const styles = {
  form: 'flex flex-col gap-5',
  tablesHeader: 'flex items-end justify-between gap-3',
  tablesTitle: 'text-base font-semibold text-carbon',
  required: 'text-error',
  tablesCount: 'text-xs text-cafe',
  grid: 'grid grid-cols-2 gap-3 sm:grid-cols-3',
  tile: 'relative flex flex-col items-center gap-2.5 rounded-2xl border bg-white px-3 pb-3 pt-4',
  tileNormal: 'border-arena/60',
  tileInvalid: 'border-error',
  remove: 'absolute right-2 top-2 flex size-7 items-center justify-center rounded-lg bg-error/10 text-error transition-colors hover:bg-error hover:text-white',
  drawing: 'flex flex-col items-center gap-1',
  chairs: 'flex h-[7px] gap-1',
  chair: 'h-[7px] w-3 rounded-full bg-mostaza',
  board: 'h-8 w-20 rounded-[10px] border-[1.5px] border-arena bg-crema',
  tableName: 'h-9 w-full rounded-lg border border-dashed border-arena bg-transparent px-2 text-center text-sm font-bold text-carbon transition-colors hover:border-solid hover:bg-campo focus:border-solid focus:border-brasa focus:bg-campo focus:outline-none focus:ring-4 focus:ring-brasa/20',
  tableNameInvalid: 'border-error',
  addTile: 'flex h-full min-h-44 w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-arena text-sm font-bold text-brasa-oscuro transition-colors hover:border-brasa hover:bg-white disabled:cursor-not-allowed disabled:opacity-50',
  error: 'text-xs text-error',
  generalError: 'text-sm text-error',
  actions: 'grid gap-3 sm:grid-cols-2',
};

const cardIn = {opacity: 0, scale: 0.9};
const cardVisible = {opacity: 1, scale: 1};

function Chairs({count}) {
  return (
    <span className={styles.chairs}>
      {Array.from({length: count}, (_, index) => <span key={index} className={styles.chair} />)}
    </span>
  );
}

// Mesa dibujada con sus sillas: la mitad arriba y la otra mitad abajo
function TableDrawing({capacity}) {
  const seats = Math.min(capacity, MAX_DRAWN_SEATS);
  return (
    <span aria-hidden className={styles.drawing}>
      <Chairs count={Math.ceil(seats / 2)} />
      <span className={styles.board} />
      <Chairs count={Math.floor(seats / 2)} />
    </span>
  );
}

function TableCard({form, table, index}) {
  const error = form.errors[tableErrorKey(table.key)];
  return (
    <motion.li layout initial={cardIn} animate={cardVisible} exit={cardIn} className={cn(styles.tile, error ? styles.tileInvalid : styles.tileNormal)}>
      <button type="button" aria-label={`Quitar ${table.nombre || `mesa ${index + 1}`}`} onClick={() => form.removeTable(table.key)} className={styles.remove}>
        <X size={15} aria-hidden />
      </button>
      <TableDrawing capacity={table.capacidad} />
      <input
        aria-label={`Nombre de la mesa ${index + 1}`}
        aria-invalid={Boolean(error) || undefined}
        maxLength={TABLE_NAME_MAX_LENGTH}
        value={table.nombre}
        onChange={(event) => form.setTable(table.key, 'nombre', event.target.value)}
        className={cn(styles.tableName, error && styles.tableNameInvalid)}
      />
      <Stepper label={`Capacidad de ${table.nombre || `la mesa ${index + 1}`}`} min={MIN_CAPACITY} max={MAX_CAPACITY} value={table.capacidad} onChange={(value) => form.setTable(table.key, 'capacidad', value)} />
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </motion.li>
  );
}

export function SectionFormModal({form}) {
  const tables = form.values.mesas;
  const people = tables.reduce((total, table) => total + table.capacidad, 0);

  return (
    <Modal
      closeButton={false}
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
            <li>
              <button type="button" onClick={form.addTable} disabled={tables.length >= MAX_TABLES} className={styles.addTile}>
                <Plus size={22} aria-hidden />
                Agregar mesa
              </button>
            </li>
          </ul>
          {form.errors.mesas && <p role="alert" className={styles.generalError}>{form.errors.mesas}</p>}
        </section>

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
