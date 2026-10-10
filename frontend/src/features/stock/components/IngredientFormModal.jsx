import {Modal} from '../../../components/organisms/Modal';
import {Button} from '../../../components/atoms/Button';
import {Input} from '../../../components/atoms/Input';
import {NumberInput} from '../../../components/atoms/NumberInput';
import {Select} from '../../../components/atoms/Select';
import {FormField} from '../../../components/molecules/FormField';
import {Alert} from '../../../components/molecules/Alert';
import {NAME_MAX_LENGTH, UNIT_OPTIONS, UNIT_SUFFIX} from '../constants/stock';

const styles = {
  form: 'flex flex-col gap-5',
  grid: 'grid gap-4 sm:grid-cols-2',
  actions: 'grid gap-3 sm:grid-cols-2',
};

export function IngredientFormModal({form}) {
  const suffix = UNIT_SUFFIX[form.values.unidad];

  return (
    <Modal
      open={form.open}
      onClose={form.close}
      title={form.isEdit ? 'Modificar insumo' : 'Registrar nuevo insumo'}
      description={form.isEdit ? 'Actualice el nombre, la unidad o el stock mínimo.' : 'Agregue un ingrediente o bebida que se controla en stock.'}
    >
      <form onSubmit={form.submit} noValidate className={styles.form}>
        <FormField label="Nombre" required error={form.errors.nombre}>
          {(control) => <Input {...control} maxLength={NAME_MAX_LENGTH} placeholder="Carne de res" value={form.values.nombre} onChange={(event) => form.setField('nombre', event.target.value)} />}
        </FormField>

        <FormField label="Unidad de medida" required error={form.errors.unidad} hint={form.isEdit ? 'No se puede cambiar si el insumo ya tiene movimientos.' : undefined}>
          {(control) => <Select {...control} placeholder="Seleccione la unidad" options={UNIT_OPTIONS} value={form.values.unidad} onChange={(event) => form.setField('unidad', event.target.value)} />}
        </FormField>

        <div className={styles.grid}>
          <FormField label="Stock mínimo" required error={form.errors.stockMinimo} hint="Debajo de este número se avisa stock bajo.">
            {(control) => <NumberInput {...control} suffix={suffix} value={form.values.stockMinimo} onChange={(event) => form.setField('stockMinimo', event.target.value)} />}
          </FormField>
          {!form.isEdit && (
            <FormField label="Stock inicial" error={form.errors.stockInicial} hint="Lo que hay hoy. Queda como primera entrada.">
              {(control) => <NumberInput {...control} suffix={suffix} value={form.values.stockInicial} onChange={(event) => form.setField('stockInicial', event.target.value)} />}
            </FormField>
          )}
        </div>

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
