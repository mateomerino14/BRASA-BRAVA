import {Modal} from '../../../components/organisms/Modal';
import {Button} from '../../../components/atoms/Button';
import {Input} from '../../../components/atoms/Input';
import {NumberInput} from '../../../components/atoms/NumberInput';
import {Select} from '../../../components/atoms/Select';
import {FormField} from '../../../components/molecules/FormField';
import {NAME_MAX_LENGTH, UNIT_OPTIONS, UNIT_SUFFIX} from '../constants/stock';

const styles = {
  form: 'flex flex-col gap-5',
  grid: 'grid gap-4 sm:grid-cols-2',
  actions: 'grid gap-3 sm:grid-cols-2',
};

export function IngredientFormModal({form}) {
  const suffix = UNIT_SUFFIX[form.values.unidad];
  const unitLocked = Boolean(form.isEdit && form.editing?.unidadFija);
  let unitHint;
  if (unitLocked) {
    unitHint = 'No se puede cambiar porque el insumo ya se usó en recetas, ventas o correcciones. Si la unidad está mal, registre un insumo nuevo.';
  }
  let quantityHint = 'Lo que hay hoy. Si lo deja vacío empieza en 0.';
  if (form.isEdit) {
    quantityHint = 'Corríjala si el conteo real es distinto.';
  }

  return (
    <Modal
      closeButton={false}
      open={form.open}
      onClose={form.close}
      title={form.isEdit ? 'Modificar insumo' : 'Registrar nuevo insumo'}
      description={form.isEdit ? 'Actualice los datos o la cantidad que hay en el local.' : 'Agregue un ingrediente o bebida del inventario.'}
    >
      <form onSubmit={form.submit} noValidate className={styles.form}>
        <FormField label="Nombre" required error={form.errors.nombre}>
          {(control) => <Input {...control} maxLength={NAME_MAX_LENGTH} placeholder="Carne de res" value={form.values.nombre} onChange={(event) => form.setField('nombre', event.target.value)} />}
        </FormField>

        <FormField label="Unidad de medida" required error={form.errors.unidad} hint={unitHint}>
          {(control) => <Select {...control} disabled={unitLocked} placeholder="Seleccione la unidad" options={UNIT_OPTIONS} value={form.values.unidad} onChange={(event) => form.setField('unidad', event.target.value)} />}
        </FormField>

        <div className={styles.grid}>
          <FormField label="Cantidad en stock" required={form.isEdit} error={form.errors.stockActual} hint={quantityHint}>
            {(control) => <NumberInput {...control} suffix={suffix} value={form.values.stockActual} onChange={(event) => form.setField('stockActual', event.target.value)} />}
          </FormField>
          <FormField label="Stock mínimo" required error={form.errors.stockMinimo} hint="Debajo de este número se avisa stock bajo.">
            {(control) => <NumberInput {...control} suffix={suffix} value={form.values.stockMinimo} onChange={(event) => form.setField('stockMinimo', event.target.value)} />}
          </FormField>
        </div>

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
