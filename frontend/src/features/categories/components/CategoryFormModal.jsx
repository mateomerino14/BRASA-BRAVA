import {useEffect, useRef} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {Plus, Trash2} from 'lucide-react';
import {Modal} from '../../../components/organisms/Modal';
import {Button} from '../../../components/atoms/Button';
import {Input} from '../../../components/atoms/Input';
import {Textarea} from '../../../components/atoms/Textarea';
import {FormField} from '../../../components/molecules/FormField';
import {ImagePicker} from '../../../components/molecules/ImagePicker';
import {IconButton} from '../../../components/atoms/IconButton';
import {subcategoryErrorKey} from '../utils/categoryForm';
import {DESCRIPTION_MAX_LENGTH, MAX_SUBCATEGORIES, NAME_MAX_LENGTH, SUBCATEGORY_NAME_MAX_LENGTH} from '../constants/categories';

const styles = {
  form: 'flex flex-col gap-5',
  grid: 'grid gap-5 md:grid-cols-[minmax(0,15rem)_1fr]',
  fields: 'flex flex-col gap-4',
  actions: 'grid gap-3 sm:grid-cols-2',
  subsHeader: 'flex items-baseline justify-between gap-3',
  subsTitle: 'text-base font-semibold text-carbon',
  required: 'text-error',
  subsCount: 'text-xs text-cafe',
  rows: 'flex flex-col gap-2',
  row: 'grid grid-cols-[1.5rem_1fr_auto] items-center gap-2',
  number: 'text-center font-display text-xl leading-none text-brasa-oscuro',
  rowError: 'col-start-2 col-end-4 text-xs font-medium text-error',
  add: 'flex h-11 w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-arena text-sm font-bold text-brasa-oscuro transition-colors hover:border-brasa hover:bg-white disabled:cursor-not-allowed disabled:opacity-50',
  generalError: 'text-sm font-medium text-error',
};

const rowIn = {opacity: 0, y: -6};
const rowVisible = {opacity: 1, y: 0};

function SubcategoryRow({form, sub, index, isLast}) {
  const error = form.errors[subcategoryErrorKey(sub.key)];
  const errorId = `subcategoria-${sub.key}-error`;
  const name = sub.nombre.trim() || `subcategoría ${index + 1}`;
  const inputRef = useRef(null);
  const shouldFocus = form.focusKey === sub.key;

  useEffect(() => {
    if (shouldFocus) {
      inputRef.current?.focus();
    }
  }, [shouldFocus]);

  // Enter en la última fila con texto agrega otra; nunca envía el formulario
  const handleKeyDown = (event) => {
    if (event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    if (isLast && sub.nombre.trim()) {
      form.addSubcategory();
    }
  };

  return (
    <motion.li layout initial={rowIn} animate={rowVisible} exit={rowIn} className={styles.row}>
      <span aria-hidden className={styles.number}>{index + 1}</span>
      <Input
        aria-label={`Subcategoría ${index + 1}`}
        aria-describedby={error ? errorId : undefined}
        ref={inputRef}
        invalid={Boolean(error)}
        maxLength={SUBCATEGORY_NAME_MAX_LENGTH}
        placeholder="Nombre de la subcategoría"
        value={sub.nombre}
        onChange={(event) => form.renameSubcategory(sub.key, event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <IconButton icon={Trash2} tone="danger" label={`Quitar ${name}`} onClick={() => form.removeSubcategory(sub.key)} />
      {error && <p id={errorId} role="alert" className={styles.rowError}>{error}</p>}
    </motion.li>
  );
}

export function CategoryFormModal({form}) {
  const subcategories = form.values.subcategorias;

  return (
    <Modal
      closeButton={false}
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

        <section aria-label="Subcategorías" className={styles.fields}>
          <div className={styles.subsHeader}>
            <p className={styles.subsTitle}>Subcategorías <span className={styles.required}>*</span></p>
            <span className={styles.subsCount}>{subcategories.length} de {MAX_SUBCATEGORIES}</span>
          </div>
          <ul className={styles.rows}>
            <AnimatePresence initial={false}>
              {subcategories.map((sub, index) => (
                <SubcategoryRow key={sub.key} form={form} sub={sub} index={index} isLast={index === subcategories.length - 1} />
              ))}
            </AnimatePresence>
          </ul>
          {form.errors.subcategorias && <p role="alert" className={styles.generalError}>{form.errors.subcategorias}</p>}
          <button type="button" onClick={form.addSubcategory} disabled={subcategories.length >= MAX_SUBCATEGORIES} className={styles.add}>
            <Plus size={16} aria-hidden />
            Agregar subcategoría
          </button>
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
