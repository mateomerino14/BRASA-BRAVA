import {AnimatePresence, motion} from 'motion/react';
import {ArrowRight} from 'lucide-react';
import {Modal} from '../../../components/organisms/Modal';
import {Button} from '../../../components/atoms/Button';
import {Input} from '../../../components/atoms/Input';
import {NumberInput} from '../../../components/atoms/NumberInput';
import {FormField} from '../../../components/molecules/FormField';
import {SegmentedControl} from '../../../components/molecules/SegmentedControl';
import {Alert} from '../../../components/molecules/Alert';
import {cn} from '../../../lib/cn';
import {QuantityAmount} from './QuantityAmount';
import {MOVEMENT_TYPES, REASON_MAX_LENGTH, UNIT_SUFFIX} from '../constants/stock';

const styles = {
  form: 'flex flex-col gap-5',
  hint: 'text-sm text-cafe',
  preview: 'flex items-center justify-between gap-3 rounded-2xl border border-arena/60 bg-white px-5 py-4',
  previewLabel: 'text-xs font-semibold uppercase tracking-wide text-cafe',
  previewEnd: 'text-right',
  previewEmpty: 'font-display text-3xl leading-none text-cafe',
  previewResult: 'text-brasa',
  previewInvalid: 'text-rojo',
  arrow: 'shrink-0 text-cafe',
  actions: 'grid gap-3 sm:grid-cols-2',
};

const hintIn = {opacity: 0, y: -4};
const hintVisible = {opacity: 1, y: 0};

function StockPreview({ingredient, preview}) {
  let result = <span className={styles.previewEmpty}>—</span>;
  if (preview !== null) {
    result = <QuantityAmount value={preview} unit={ingredient.unidad} size="lg" valueClassName={cn(styles.previewResult, preview < 0 && styles.previewInvalid)} />;
  }
  return (
    <div className={styles.preview} aria-live="polite">
      <div>
        <p className={styles.previewLabel}>Stock actual</p>
        <QuantityAmount value={ingredient.stockActual} unit={ingredient.unidad} size="lg" />
      </div>
      <ArrowRight size={22} aria-hidden className={styles.arrow} />
      <div className={styles.previewEnd}>
        <p className={styles.previewLabel}>Queda</p>
        {result}
      </div>
    </div>
  );
}

export function MovementModal({movement}) {
  const ingredient = movement.target;
  const type = MOVEMENT_TYPES.find((item) => item.value === movement.values.tipo);

  return (
    <Modal open={Boolean(ingredient)} onClose={movement.close} title="Registrar movimiento" description={ingredient?.nombre}>
      {ingredient && (
        <form onSubmit={movement.submit} noValidate className={styles.form}>
          <SegmentedControl label="Tipo de movimiento" options={MOVEMENT_TYPES} value={movement.values.tipo} onChange={(value) => movement.setField('tipo', value)} />
          <AnimatePresence mode="wait" initial={false}>
            <motion.p key={type.value} initial={hintIn} animate={hintVisible} exit={hintIn} className={styles.hint}>
              {type.hint}
            </motion.p>
          </AnimatePresence>

          <FormField label={type.quantityLabel} required error={movement.errors.cantidad}>
            {(control) => <NumberInput {...control} suffix={UNIT_SUFFIX[ingredient.unidad]} value={movement.values.cantidad} onChange={(event) => movement.setField('cantidad', event.target.value)} />}
          </FormField>

          <StockPreview ingredient={ingredient} preview={movement.preview} />

          <FormField label="Motivo" hint="Opcional. Por ejemplo: compra a proveedor, merma, conteo semanal.">
            {(control) => <Input {...control} maxLength={REASON_MAX_LENGTH} value={movement.values.motivo} onChange={(event) => movement.setField('motivo', event.target.value)} />}
          </FormField>

          {movement.modalError && <Alert tone="error">{movement.modalError}</Alert>}

          <div className={styles.actions}>
            <Button variant="outline" onClick={movement.close} disabled={movement.saving}>
              Cancelar
            </Button>
            <Button type="submit" loading={movement.saving}>
              Registrar {type.label.toLowerCase()}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
