import {ShoppingBag, Utensils} from 'lucide-react';
import {Button} from '../../../components/atoms/Button';
import {Modal} from '../../../components/organisms/Modal';
import {countText} from '../../../lib/format';
import {removedText} from '../utils/kitchen';
import {ReadyLine} from './ReadyLine';

const styles = {
  columns: 'grid gap-4 md:grid-cols-3',
  column: 'flex flex-col gap-2 rounded-2xl bg-white/60 p-3',
  missing: 'flex flex-col gap-2 rounded-2xl border-2 border-dashed border-brasa/40 p-3',
  heading: 'flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-carbon',
  missingHeading: 'text-xs font-bold uppercase tracking-wider text-brasa-oscuro',
  list: 'flex flex-col gap-2',
  none: 'rounded-xl border border-dashed border-arena px-3 py-4 text-center text-sm text-cafe',
  missingList: 'flex flex-col gap-1.5 text-sm text-carbon',
  missingRow: 'flex justify-between gap-2',
  removed: 'text-rojo',
  hint: 'mt-auto border-t border-arena/60 pt-3 text-xs text-cafe',
  allDone: 'text-sm font-semibold text-verde',
  actions: 'grid gap-3 sm:grid-cols-2',
};

function Column({title, empty, icon: Icon, lines, busy, onMark}) {
  return (
    <section aria-label={title} className={styles.column}>
      <h3 className={styles.heading}><Icon size={14} aria-hidden /> {title}</h3>
      {lines.length === 0 && <p className={styles.none}>{empty}</p>}
      {lines.length > 0 && (
        <ul className={styles.list}>
          {lines.map((line) => <ReadyLine key={line.id} line={line} busy={busy} onMark={onMark} />)}
        </ul>
      )}
    </section>
  );
}

// Marcar listos de una mesa como en cafebar: lo del local, lo para llevar y lo que todavía falta
export function ReadyModal({open, mesa, venta, busy, onMark, onMarkAll, onClose}) {
  const detalles = venta?.detalles ?? [];
  const missing = detalles.filter((line) => line.listos < line.cantidad);
  const pending = missing.reduce((total, line) => total + line.cantidad - line.listos, 0);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Marcar listos · ${mesa?.nombre ?? ''}`}
      description={venta && `Pedido Nº ${venta.numero} · lo que ya salió de cocina`}
      size="xl"
      footer={(
        <div className={styles.actions}>
          <Button variant="outline" action="close" onClick={onClose}>Cerrar</Button>
          <Button action="ready" loading={busy === 'all'} disabled={pending === 0 || Boolean(busy)} onClick={onMarkAll}>Todo listo</Button>
        </div>
      )}
    >
      <div className={styles.columns}>
        <Column title="Local" empty="Nada para el local" icon={Utensils} lines={detalles.filter((line) => line.consumo !== 'llevar')} busy={Boolean(busy)} onMark={onMark} />
        <Column title="Para llevar" empty="Nada para llevar" icon={ShoppingBag} lines={detalles.filter((line) => line.consumo === 'llevar')} busy={Boolean(busy)} onMark={onMark} />
        <section aria-label="Faltan" className={styles.missing}>
          <h3 className={styles.missingHeading}>Faltan</h3>
          {missing.length === 0 && <p className={styles.allDone}>Ya salió todo. Se puede cobrar.</p>}
          {missing.length > 0 && (
            <ul className={styles.missingList}>
              {missing.map((line) => {
                const removed = removedText(line);
                return (
                  <li key={line.id} className={styles.missingRow}>
                    <span>{line.nombre}{removed && <span className={styles.removed}> ({removed.toLowerCase()})</span>}</span>
                    <strong>{line.cantidad - line.listos}</strong>
                  </li>
                );
              })}
            </ul>
          )}
          <p className={styles.hint}>{pending > 0 ? `${countText(pending, 'unidad', 'unidades')} por salir. Cuando no falte nada se habilita Cobrar.` : 'Cobrar ya está habilitado.'}</p>
        </section>
      </div>
    </Modal>
  );
}
