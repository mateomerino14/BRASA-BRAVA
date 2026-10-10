import {Modal} from '../../../components/organisms/Modal';
import {Button} from '../../../components/atoms/Button';
import {Input} from '../../../components/atoms/Input';
import {MoneyInput} from '../../../components/atoms/MoneyInput';
import {Select} from '../../../components/atoms/Select';
import {Textarea} from '../../../components/atoms/Textarea';
import {FormField} from '../../../components/molecules/FormField';
import {ImagePicker} from '../../../components/molecules/ImagePicker';
import {Alert} from '../../../components/molecules/Alert';
import {DESCRIPTION_MAX_LENGTH, NAME_MAX_LENGTH} from '../constants/products';
import {buildCategoryOptions} from '../utils/productForm';

const styles = {
  form: 'flex flex-col gap-5',
  grid: 'grid gap-5 md:grid-cols-[minmax(0,15rem)_1fr]',
  fields: 'flex flex-col gap-4',
  pair: 'grid gap-4 sm:grid-cols-2',
  actions: 'grid gap-3 sm:grid-cols-2',
};

const toSelectOptions = (items) => items.map((item) => ({value: String(item.id), label: item.nombre}));

export function ProductFormModal({form, categories}) {
  const options = buildCategoryOptions(categories, form.editing);
  const category = options.find((item) => String(item.id) === form.values.idCategoria);
  const subcategories = category?.subcategorias ?? [];

  return (
    <Modal
      open={form.open}
      onClose={form.close}
      size="lg"
      title={form.isEdit ? 'Modificar producto' : 'Registrar nuevo producto'}
      description={form.isEdit ? 'Actualice los datos, el precio o la foto del producto.' : 'Agregue un producto al menú con su precio y foto.'}
    >
      <form onSubmit={form.submit} noValidate className={styles.form}>
        <div className={styles.grid}>
          <FormField label="Foto del producto">
            {() => <ImagePicker label="Foto del producto" file={form.image.file} url={form.image.url} onChange={form.changeImage} />}
          </FormField>

          <div className={styles.fields}>
            <FormField label="Nombre" required error={form.errors.nombre}>
              {(control) => (
                <Input {...control} maxLength={NAME_MAX_LENGTH} placeholder="Hamburguesa Clásica" value={form.values.nombre} onChange={(event) => form.setField('nombre', event.target.value)} />
              )}
            </FormField>
            <FormField label="Precio" required error={form.errors.precio}>
              {(control) => <MoneyInput {...control} value={form.values.precio} onChange={(event) => form.setField('precio', event.target.value)} />}
            </FormField>
          </div>
        </div>

        <div className={styles.pair}>
          <FormField label="Categoría" required error={form.errors.idCategoria}>
            {(control) => (
              <Select {...control} placeholder="Seleccione una categoría" options={toSelectOptions(options)} value={form.values.idCategoria} onChange={(event) => form.changeCategory(event.target.value)} />
            )}
          </FormField>
          <FormField label="Subcategoría" required error={form.errors.idSubcategoria}>
            {(control) => (
              <Select
                {...control}
                placeholder={category ? 'Seleccione una subcategoría' : 'Elija primero la categoría'}
                disabled={!category}
                options={toSelectOptions(subcategories)}
                value={form.values.idSubcategoria}
                onChange={(event) => form.setField('idSubcategoria', event.target.value)}
              />
            )}
          </FormField>
        </div>

        <FormField label="Descripción" hint="Opcional. Ingredientes o detalle para el cliente.">
          {(control) => (
            <Textarea {...control} maxLength={DESCRIPTION_MAX_LENGTH} placeholder="Breve descripción del producto" value={form.values.descripcion} onChange={(event) => form.setField('descripcion', event.target.value)} />
          )}
        </FormField>

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
