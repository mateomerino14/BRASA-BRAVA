import {AnimatePresence, motion} from 'motion/react';
import {ChefHat, Plus, Trash2} from 'lucide-react';
import {Modal} from '../../../components/organisms/Modal';
import {Button} from '../../../components/atoms/Button';
import {IconButton} from '../../../components/atoms/IconButton';
import {NumberInput} from '../../../components/atoms/NumberInput';
import {Select} from '../../../components/atoms/Select';
import {Spinner} from '../../../components/atoms/Spinner';
import {Amount} from '../../../components/atoms/Amount';
import {Alert} from '../../../components/molecules/Alert';
import {formatQuantity} from '../../../lib/format';
import {cn} from '../../../lib/cn';
import {UNIT_SUFFIX} from '../../../config/units';

const styles = {
  form: 'flex flex-col gap-5',
  hint: 'text-sm text-cafe',
  list: 'flex flex-col gap-3',
  row: 'grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 sm:grid-cols-[minmax(0,1fr)_8.5rem_auto]',
  ingredient: 'col-span-2 sm:col-span-1',
  stock: 'mt-1 text-xs text-cafe',
  inactive: 'text-rojo',
  error: 'col-span-full text-sm text-rojo',
  remove: 'mt-2',
  empty: 'rounded-2xl border border-dashed border-arena bg-crema/60 px-4 py-6 text-center text-sm text-cafe',
  summary: 'flex items-center gap-4 rounded-2xl border border-arena/60 bg-white px-5 py-4',
  summaryIcon: 'flex size-11 shrink-0 items-center justify-center rounded-xl bg-brasa/10 text-brasa',
  summaryLabel: 'text-sm text-cafe',
  loading: 'flex justify-center py-10',
  actions: 'grid gap-3 sm:grid-cols-2',
};

const rowIn = {opacity: 0, height: 0};
const rowVisible = {opacity: 1, height: 'auto'};

const optionsFor = (ingredients) => [...ingredients.values()]
  .map((item) => ({value: String(item.id), label: item.activo ? item.nombre : `${item.nombre} (de baja)`}))
  .sort((a, b) => a.label.localeCompare(b.label, 'es'));

function PortionsSummary({portions}) {
  let content = <p className={styles.summaryLabel}>Agregue insumos con su cantidad para calcular cuántas porciones alcanzan.</p>;
  if (portions !== null) {
    content = (
      <div>
        <p className={styles.summaryLabel}>Con el stock actual alcanza para</p>
        <Amount value={String(portions)} suffix={portions === 1 ? 'porción' : 'porciones'} size="lg" />
      </div>
    );
  }
  return (
    <div className={styles.summary} aria-live="polite">
      <span className={styles.summaryIcon}><ChefHat size={22} aria-hidden /></span>
      {content}
    </div>
  );
}

function RecipeRow({recipe, row, options, index}) {
  const ingredient = recipe.ingredients.get(row.idInsumo);
  return (
    <motion.li layout initial={rowIn} animate={rowVisible} exit={rowIn} className={styles.row}>
      <div className={styles.ingredient}>
        <Select aria-label={`Insumo ${index + 1}`} placeholder="Seleccione un insumo" options={options} value={row.idInsumo} invalid={Boolean(recipe.errors[row.key])} onChange={(event) => recipe.setRow(row.key, 'idInsumo', event.target.value)} />
        {ingredient && (
          <p className={cn(styles.stock, !ingredient.activo && styles.inactive)}>
            {ingredient.activo ? `Stock: ${formatQuantity(ingredient.stockActual, ingredient.unidad)}` : 'Insumo dado de baja'}
          </p>
        )}
      </div>
      <NumberInput aria-label={`Cantidad ${index + 1}`} suffix={UNIT_SUFFIX[ingredient?.unidad]} value={row.cantidad} invalid={Boolean(recipe.errors[row.key])} onChange={(event) => recipe.setRow(row.key, 'cantidad', event.target.value)} />
      <IconButton icon={Trash2} tone="danger" label={`Quitar insumo ${index + 1}`} className={styles.remove} onClick={() => recipe.removeRow(row.key)} />
      {recipe.errors[row.key] && <p role="alert" className={styles.error}>{recipe.errors[row.key]}</p>}
    </motion.li>
  );
}

export function RecipeModal({recipe}) {
  const options = optionsFor(recipe.ingredients);
  let body = <div className={styles.loading}><Spinner size={28} label="Cargando receta" /></div>;
  if (!recipe.loading) {
    body = (
      <>
        {recipe.rows.length === 0 && <p className={styles.empty}>Sin receta: el producto no descuenta insumos al venderse.</p>}
        <ul aria-label="Ingredientes" className={styles.list}>
          <AnimatePresence initial={false}>
            {recipe.rows.map((row, index) => <RecipeRow key={row.key} recipe={recipe} row={row} options={options} index={index} />)}
          </AnimatePresence>
        </ul>
        <Button variant="outline" size="sm" icon={<Plus size={16} aria-hidden />} onClick={recipe.addRow}>
          Agregar insumo
        </Button>
        <PortionsSummary portions={recipe.portions} />
      </>
    );
  }

  return (
    <Modal open={Boolean(recipe.target)} onClose={recipe.close} size="lg" title="Receta" description={recipe.target?.nombre}>
      <form onSubmit={recipe.submit} noValidate className={styles.form}>
        <p className={styles.hint}>Cantidad de cada insumo que lleva una porción. Caja la descontará del stock en cada venta.</p>
        {body}
        {recipe.modalError && <Alert tone="error">{recipe.modalError}</Alert>}
        <div className={styles.actions}>
          <Button variant="outline" onClick={recipe.close} disabled={recipe.saving}>
            Cancelar
          </Button>
          <Button type="submit" loading={recipe.saving} disabled={recipe.loading}>
            Guardar receta
          </Button>
        </div>
      </form>
    </Modal>
  );
}
