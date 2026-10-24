import {AnimatePresence, motion} from 'motion/react';
import {Plus, Tag, Trash2} from 'lucide-react';
import {Modal} from '../../../components/organisms/Modal';
import {Button} from '../../../components/atoms/Button';
import {Input} from '../../../components/atoms/Input';
import {TimeInput} from '../../../components/atoms/TimeInput';
import {DateInput} from '../../../components/molecules/DateInput';
import {MoneyInput} from '../../../components/atoms/MoneyInput';
import {Select} from '../../../components/atoms/Select';
import {Textarea} from '../../../components/atoms/Textarea';
import {IconButton} from '../../../components/atoms/IconButton';
import {FormField} from '../../../components/molecules/FormField';
import {ImagePicker} from '../../../components/molecules/ImagePicker';
import {Stepper} from '../../../components/molecules/Stepper';
import {DayPicker} from '../../../components/molecules/DayPicker';
import {PriceTag} from '../../../components/molecules/PriceTag';
import {formatAmount} from '../../../lib/format';
import {DESCRIPTION_MAX_LENGTH, MAX_PRODUCTS, MAX_QUANTITY, NAME_MAX_LENGTH} from '../constants/promotions';
import {previewPricing, productErrorKey} from '../utils/promotionForm';

const styles = {
  form: 'flex flex-col gap-5',
  grid: 'grid gap-5 md:grid-cols-[minmax(0,14rem)_1fr]',
  fields: 'flex flex-col gap-4',
  pair: 'grid gap-4 sm:grid-cols-2',
  sectionTitle: 'text-base font-semibold text-carbon',
  required: 'text-error',
  rows: 'flex flex-col gap-2',
  row: 'grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2',
  rowError: 'col-span-full text-xs text-error',
  error: 'text-sm text-error',
  preview: 'flex items-center justify-between gap-4 rounded-2xl border border-arena/60 bg-white px-5 py-4',
  previewLeft: 'flex items-center gap-3',
  previewIcon: 'flex size-11 shrink-0 items-center justify-center rounded-xl bg-brasa/10 text-brasa',
  previewLabel: 'text-sm text-cafe',
  previewSavings: 'text-xs font-semibold text-verde',
  actions: 'grid gap-3 sm:grid-cols-2',
};

const rowIn = {opacity: 0, height: 0};
const rowVisible = {opacity: 1, height: 'auto'};

const productLabel = (item) => {
  const label = `${item.nombre} — Bs ${formatAmount(item.precio)}`;
  if (item.activo) {
    return label;
  }
  return `${label} (de baja)`;
};

const productOptions = (productsById) => [...productsById.values()]
  .map((item) => ({value: String(item.id), label: productLabel(item)}))
  .sort((a, b) => a.label.localeCompare(b.label, 'es'));

function ProductRow({form, row, index, options}) {
  const error = form.errors[productErrorKey(row.key)];
  const product = form.productsById.get(row.idProducto);
  return (
    <motion.li layout initial={rowIn} animate={rowVisible} exit={rowIn} className={styles.row}>
      <Select aria-label={`Producto ${index + 1}`} placeholder="Seleccione un producto" options={options} invalid={Boolean(error)} value={row.idProducto} onChange={(event) => form.setProduct(row.key, 'idProducto', event.target.value)} />
      <Stepper label={`Cantidad de ${product?.nombre ?? `producto ${index + 1}`}`} min={1} max={MAX_QUANTITY} value={row.cantidad} onChange={(value) => form.setProduct(row.key, 'cantidad', value)} />
      <IconButton icon={Trash2} tone="danger" label={`Quitar producto ${index + 1}`} onClick={() => form.removeProduct(row.key)} />
      {error && <p role="alert" className={styles.rowError}>{error}</p>}
    </motion.li>
  );
}

function PricePreview({form}) {
  const pricing = previewPricing(form.values, form.productsById);
  let content = <p className={styles.previewLabel}>Elija productos y el valor para ver el precio final.</p>;
  if (pricing?.promo !== null && pricing?.promo !== undefined) {
    content = <PriceTag regular={pricing.regular} promo={pricing.promo} size="lg" />;
  }
  else if (pricing) {
    content = <p className={styles.previewLabel}>Por separado: Bs {formatAmount(pricing.regular)}</p>;
  }
  return (
    <div className={styles.preview} aria-live="polite">
      <div className={styles.previewLeft}>
        <span className={styles.previewIcon}><Tag size={20} aria-hidden /></span>
        <div>
          <p className={styles.previewLabel}>Precio para el cliente</p>
          {pricing?.ahorro > 0 && <p className={styles.previewSavings}>Ahorra Bs {formatAmount(pricing.ahorro)}</p>}
        </div>
      </div>
      {content}
    </div>
  );
}

export function PromotionFormModal({form}) {
  const options = productOptions(form.productsById);

  return (
    <Modal
      closeButton={false}
      open={form.open}
      onClose={form.close}
      size="lg"
      title={form.isEdit ? 'Modificar promoción' : 'Registrar nueva promoción'}
      description="Arme un combo de productos a precio fijo, con sus fechas, días y horario."
    >
      <form onSubmit={form.submit} noValidate className={styles.form}>
        <div className={styles.grid}>
          <FormField label="Foto de la promoción" className="h-full">
            {() => <ImagePicker fill label="Foto de la promoción" file={form.image.file} url={form.image.url} onChange={form.changeImage} />}
          </FormField>
          <div className={styles.fields}>
            <FormField label="Nombre" required error={form.errors.nombre}>
              {(control) => <Input {...control} maxLength={NAME_MAX_LENGTH} placeholder="Combo Brava" value={form.values.nombre} onChange={(event) => form.setField('nombre', event.target.value)} />}
            </FormField>
            <FormField label="Precio del combo" required error={form.errors.valor} hint="Debe ser menor que comprar los productos por separado.">
              {(control) => <MoneyInput {...control} value={form.values.valor} onChange={(event) => form.setField('valor', event.target.value)} />}
            </FormField>
          </div>
        </div>

        <section aria-label="Productos de la promoción" className={styles.rows}>
          <p className={styles.sectionTitle}>Productos <span className={styles.required}>*</span></p>
          <ul className={styles.rows}>
            <AnimatePresence initial={false}>
              {form.values.productos.map((row, index) => <ProductRow key={row.key} form={form} row={row} index={index} options={options} />)}
            </AnimatePresence>
          </ul>
          {form.errors.productos && <p role="alert" className={styles.error}>{form.errors.productos}</p>}
          <Button variant="outline" size="sm" icon={<Plus size={16} aria-hidden />} onClick={form.addProduct} disabled={form.values.productos.length >= MAX_PRODUCTS}>
            Agregar producto
          </Button>
        </section>

        <PricePreview form={form} />

        <div className={styles.pair}>
          <FormField label="Desde" required error={form.errors.fechaInicio}>
            {(control) => <DateInput {...control} label="Fecha de inicio" value={form.values.fechaInicio} onChange={(value) => form.setField('fechaInicio', value)} />}
          </FormField>
          <FormField label="Hasta" error={form.errors.fechaFin} hint="Déjela vacía si no tiene fecha de fin.">
            {(control) => <DateInput {...control} label="Fecha de fin" clearable min={form.values.fechaInicio} value={form.values.fechaFin} onChange={(value) => form.setField('fechaFin', value)} />}
          </FormField>
        </div>

        <div className={styles.rows}>
          <p className={styles.sectionTitle}>Días en que aplica <span className={styles.required}>*</span></p>
          <DayPicker value={form.values.dias} onChange={(value) => form.setField('dias', value)} />
          {form.errors.dias && <p role="alert" className={styles.error}>{form.errors.dias}</p>}
        </div>

        <div className={styles.rows}>
          <p className={styles.sectionTitle}>Horario</p>
          <div className={styles.pair}>
            <FormField label="Hora de inicio" error={form.errors.horaInicio} hint="Déjelo vacío si vale todo el día.">
              {(control) => <TimeInput {...control} label="Hora de inicio" value={form.values.horaInicio} onChange={(value) => form.setField('horaInicio', value)} />}
            </FormField>
            <FormField label="Hora de fin" error={form.errors.horaFin}>
              {(control) => <TimeInput {...control} label="Hora de fin" value={form.values.horaFin} onChange={(value) => form.setField('horaFin', value)} />}
            </FormField>
          </div>
        </div>

        <FormField label="Descripción" hint="Opcional. Se mostrará al cliente en Familia.">
          {(control) => <Textarea {...control} maxLength={DESCRIPTION_MAX_LENGTH} placeholder="Breve descripción de la promoción" value={form.values.descripcion} onChange={(event) => form.setField('descripcion', event.target.value)} />}
        </FormField>

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
