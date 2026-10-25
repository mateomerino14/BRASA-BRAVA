import {TriangleAlert} from 'lucide-react';
import {Button} from '../../../components/atoms/Button';
import {Input} from '../../../components/atoms/Input';
import {Spinner} from '../../../components/atoms/Spinner';
import {FormField} from '../../../components/molecules/FormField';
import {Modal} from '../../../components/organisms/Modal';
import {countText, formatAmount} from '../../../lib/format';
import {CONFIRMATION_WORD, TYPE_LABELS} from '../constants/deletion';

const styles = {
  box: 'rounded-2xl border-2 border-rojo/40 bg-rojo/5 p-4',
  boxTitle: 'flex items-center gap-2 font-semibold text-rojo',
  list: 'mt-3 flex flex-col gap-1.5 text-sm text-carbon',
  strong: 'font-semibold',
  blocked: 'rounded-2xl border-2 border-mostaza bg-mostaza/15 p-4 text-sm text-carbon',
  blockedList: 'mt-2 flex list-disc flex-col gap-1 pl-5',
  form: 'mt-4 flex flex-col gap-4',
  loading: 'flex justify-center py-8',
  actions: 'grid gap-3 sm:grid-cols-2',
  blockedActions: 'mt-6 grid gap-3 sm:grid-cols-2',
};

// Líneas de lo elegido y de lo que se borra en cascada
const linesOf = ({elegidos, arrastra}) => {
  const lines = [];
  for (const [tipo, names] of Object.entries(elegidos)) {
    if (tipo !== 'ventas' && names.length > 0) {
      lines.push([TYPE_LABELS[tipo], names.join(', ')]);
    }
  }
  if (elegidos.ventas > 0) {
    lines.push(['Ventas elegidas', countText(elegidos.ventas, 'venta', 'ventas')]);
  }
  if (arrastra.empleados.length > 0) {
    lines.push(['Sus empleados', arrastra.empleados.join(', ')]);
  }
  if (arrastra.mesas.length > 0) {
    lines.push(['Sus mesas', arrastra.mesas.join(', ')]);
  }
  if (arrastra.productos.length > 0) {
    lines.push(['Sus productos', arrastra.productos.join(', ')]);
  }
  if (arrastra.promociones.length > 0) {
    lines.push(['Promociones que los incluyen', arrastra.promociones.join(', ')]);
  }
  if (arrastra.ventas.total > 0) {
    const sample = arrastra.ventas.ejemplos.map((sale) => `Nº ${sale.id} (${sale.mesa}, Bs ${formatAmount(sale.total)})`).join(', ');
    let more = '';
    if (arrastra.ventas.total > arrastra.ventas.ejemplos.length) {
      more = ` y ${arrastra.ventas.total - arrastra.ventas.ejemplos.length} más`;
    }
    lines.push(['Ventas asociadas', `${countText(arrastra.ventas.total, 'venta', 'ventas')}: ${sample}${more}`]);
  }
  return lines;
};

// Confirmación final: todo lo que se borra (en cascada) y la palabra ELIMINAR
export function DeletionConfirmModal({deletion}) {
  const {preview} = deletion;
  const data = preview.data;
  const blocked = data?.bloqueos.length > 0;
  const submit = (event) => {
    event.preventDefault();
    deletion.execute();
  };
  return (
    <Modal open={preview.open} onClose={deletion.closePreview} title="Eliminar para siempre" description="Esto no se puede deshacer.">
      {preview.loading && <div className={styles.loading}><Spinner size={28} label="Revisando lo elegido" /></div>}
      {data && blocked && (
        <div role="alert" className={styles.blocked}>
          <p className={styles.strong}>Todavía no se puede eliminar:</p>
          <ul className={styles.blockedList}>{data.bloqueos.map((text) => <li key={text}>{text}</li>)}</ul>
        </div>
      )}
      {data && !blocked && (
        <form noValidate onSubmit={submit}>
          <div className={styles.box}>
            <p className={styles.boxTitle}><TriangleAlert size={18} aria-hidden /> Se borra todo esto</p>
            <ul className={styles.list}>
              {linesOf(data).map(([label, text]) => <li key={label}><span className={styles.strong}>{label}:</span> {text}</li>)}
            </ul>
          </div>
          <div className={styles.form}>
            <FormField label={`Escriba ${CONFIRMATION_WORD} para confirmar`} required error={deletion.confirmError}>
              {(field) => <Input {...field} autoComplete="off" value={deletion.confirmacion} onChange={(event) => deletion.changeConfirmacion(event.target.value)} />}
            </FormField>
            <div className={styles.actions}>
              <Button variant="outline" action="cancel" disabled={deletion.executing} onClick={deletion.closePreview}>Cancelar</Button>
              <Button type="submit" variant="danger" action="remove" loading={deletion.executing}>Sí, eliminar</Button>
            </div>
          </div>
        </form>
      )}
      {data && blocked && (
        <div className={styles.blockedActions}>
          <Button variant="outline" action="close" onClick={deletion.closePreview}>Cerrar</Button>
        </div>
      )}
    </Modal>
  );
}
