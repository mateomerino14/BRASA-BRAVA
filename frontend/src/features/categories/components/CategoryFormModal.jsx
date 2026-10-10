import {Modal} from '../../../components/organisms/Modal';
import {Button} from '../../../components/atoms/Button';
import {Input} from '../../../components/atoms/Input';
import {Textarea} from '../../../components/atoms/Textarea';
import {FormField} from '../../../components/molecules/FormField';
import {ImagePicker} from '../../../components/molecules/ImagePicker';
import {TagInput} from '../../../components/molecules/TagInput';
import {Alert} from '../../../components/molecules/Alert';
import {DESCRIPTION_MAX_LENGTH, MAX_SUBCATEGORIES, NAME_MAX_LENGTH} from '../constants/categories';

const styles = {
  form: 'flex flex-col gap-5',
  grid: 'grid gap-5 md:grid-cols-[minmax(0,15rem)_1fr]',
  fields: 'flex flex-col gap-4',
  actions: 'grid gap-3 sm:grid-cols-2',
};

export function CategoryFormModal({form}) {
  const tags = form.values.subcategorias.map((sub) => ({key: sub.key, label: sub.nombre}));

  return (
    <Modal
      open={form.open}
      onClose={form.close}
      size="lg"
      title={form.isEdit ? 'Modificar categoría' : 'Registrar nueva categoría'}
      description={form.isEdit ? 'Actualice los datos, la foto o las subcategorías.' : 'Agregue una sección del menú con su foto y subcategorías.'}
    >
      <form onSubmit={form.submit} noValidate className={styles.form}>
        <div className={styles.grid}>
          <FormField label="Foto de la categoría">
            {() => <ImagePicker label="Foto de la categoría" file={form.image.file} url={form.image.url} onChange={form.changeImage} />}
          </FormField>

          <div className={styles.fields}>
            <FormField label="Nombre" required error={form.errors.nombre}>
              {(control) => (
                <Input {...control} maxLength={NAME_MAX_LENGTH} placeholder="Hamburguesas" value={form.values.nombre} onChange={(event) => form.setField('nombre', event.target.value)} />
              )}
            </FormField>
            <FormField label="Descripción" hint="Opcional. Se muestra como apoyo en la tabla.">
              {(control) => (
                <Textarea {...control} maxLength={DESCRIPTION_MAX_LENGTH} placeholder="Breve descripción de la categoría" value={form.values.descripcion} onChange={(event) => form.setField('descripcion', event.target.value)} />
              )}
            </FormField>
          </div>
        </div>

        <FormField label="Subcategorías" required error={form.errors.subcategorias} hint="Escriba cada una y presione Enter.">
          {(control) => (
            <TagInput {...control} tags={tags} max={MAX_SUBCATEGORIES} placeholder="Clásicas, Especiales…" onAdd={form.addSubcategory} onRemove={form.removeSubcategory} />
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
