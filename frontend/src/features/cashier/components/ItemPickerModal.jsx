import {useState} from 'react';
import {Check, X} from 'lucide-react';
import {Modal} from '../../../components/organisms/Modal';
import {Button} from '../../../components/atoms/Button';
import {Amount} from '../../../components/atoms/Amount';
import {Stepper} from '../../../components/molecules/Stepper';
import {SegmentedControl} from '../../../components/molecules/SegmentedControl';
import {cn} from '../../../lib/cn';
import {formatAmount} from '../../../lib/format';
import {CONSUMPTION_OPTIONS, MAX_QUANTITY} from '../constants/cashier';
import {ingredientGroups} from '../hooks/useTableOrder';
import {addAmounts} from '../utils/cart';

const styles = {
  body: 'flex flex-col gap-5',
  row: 'grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start',
  field: 'flex flex-col gap-1.5',
  stepper: 'self-start',
  label: 'text-base font-semibold text-carbon',
  hint: 'text-sm text-cafe',
  group: 'flex flex-col gap-2 rounded-card border border-arena/50 bg-white p-3',
  groupTitle: 'text-sm font-semibold text-carbon',
  chips: 'flex flex-wrap gap-2',
  chip: 'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brasa',
  kept: 'border-verde/40 bg-verde/10 text-carbon hover:border-verde',
  removed: 'border-rojo/50 bg-rojo/10 text-rojo line-through hover:border-rojo',
  footer: 'flex items-center justify-between gap-3 rounded-card bg-hueso px-4 py-3',
  totalLabel: 'text-sm font-semibold text-cafe',
  actions: 'grid gap-3 sm:grid-cols-2',
};

const exclusionKey = (idProducto, idInsumo) => `${idProducto}:${idInsumo}`;

const initialValues = (line) => ({
  cantidad: line?.cantidad ?? 1,
  consumo: line?.consumo ?? 'local',
  removed: new Set((line?.exclusiones ?? []).map((item) => exclusionKey(item.idProducto, item.idInsumo))),
});

// Elige cantidad, consumo e ingredientes a quitar de un producto o combo antes de sumarlo al pedido
function PickerForm({picker, onConfirm, onClose}) {
  const {kind, item, line} = picker;
  const [values, setValues] = useState(() => initialValues(line));
  const groups = ingredientGroups(kind, item);
  const hasIngredients = groups.some((group) => group.ingredientes.length > 0);

  const toggle = (key) => {
    setValues((current) => {
      const removed = new Set(current.removed);
      if (removed.has(key)) {
        removed.delete(key);
      }
      else {
        removed.add(key);
      }
      return {...current, removed};
    });
  };

  const confirm = () => {
    const exclusiones = [];
    for (const group of groups) {
      for (const ingredient of group.ingredientes) {
        if (values.removed.has(exclusionKey(group.idProducto, ingredient.id))) {
          exclusiones.push({idProducto: group.idProducto, producto: group.nombre, idInsumo: ingredient.id, insumo: ingredient.nombre});
        }
      }
    }
    onConfirm({cantidad: values.cantidad, consumo: values.consumo, exclusiones});
  };

  return (
    <div className={styles.body}>
      <div className={styles.row}>
        <div className={styles.field}>
          <span className={styles.label}>Cantidad</span>
          <Stepper label={`Cantidad de ${item.nombre}`} className={styles.stepper} value={values.cantidad} max={MAX_QUANTITY} onChange={(cantidad) => setValues((current) => ({...current, cantidad}))} />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>Consumo</span>
          <SegmentedControl label="Tipo de consumo" options={CONSUMPTION_OPTIONS} value={values.consumo} onChange={(consumo) => setValues((current) => ({...current, consumo}))} />
        </div>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Quitar ingredientes</span>
        {hasIngredients ? (
          <span className={styles.hint}>Toque los que el cliente no quiere. Para unidades con distintos cambios, agréguelas por separado.</span>
        ) : (
          <span className={styles.hint}>No tiene receta cargada, así que no hay ingredientes para quitar.</span>
        )}
      </div>
      {groups.filter((group) => group.ingredientes.length > 0).map((group) => (
        <div key={group.idProducto} role="group" aria-label={`Ingredientes de ${group.nombre}`} className={styles.group}>
          {kind === 'promocion' && <span className={styles.groupTitle}>{group.cantidad}× {group.nombre}</span>}
          <div className={styles.chips}>
            {group.ingredientes.map((ingredient) => {
              const key = exclusionKey(group.idProducto, ingredient.id);
              const removed = values.removed.has(key);
              return (
                <button key={key} type="button" aria-pressed={removed} onClick={() => toggle(key)} className={cn(styles.chip, removed ? styles.removed : styles.kept)}>
                  {removed ? <X size={14} aria-hidden /> : <Check size={14} aria-hidden />}
                  {ingredient.nombre}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className={styles.footer}>
        <span className={styles.totalLabel}>Subtotal</span>
        <Amount prefix="Bs" size="lg" value={formatAmount(addAmounts(item.precio * values.cantidad))} />
      </div>
      <div className={styles.actions}>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={confirm}>{line ? 'Guardar cambios' : 'Agregar al pedido'}</Button>
      </div>
    </div>
  );
}

export function ItemPickerModal({picker, onConfirm, onClose}) {
  let description = '';
  if (picker.item) {
    description = picker.item.descripcion ?? '';
    if (picker.kind === 'promocion') {
      description = picker.item.productos.map((product) => `${product.cantidad}× ${product.nombre}`).join(' + ');
    }
  }
  return (
    <Modal open={picker.open} onClose={onClose} title={picker.item?.nombre ?? ''} description={description || undefined} size="lg">
      {picker.item && <PickerForm key={picker.session} picker={picker} onConfirm={onConfirm} onClose={onClose} />}
    </Modal>
  );
}
