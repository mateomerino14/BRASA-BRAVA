import {useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {ChevronDown, Pencil, Printer, Send, ShoppingBasket, Trash2} from 'lucide-react';
import {Badge} from '../../../components/atoms/Badge';
import {Alert} from '../../../components/molecules/Alert';
import {Amount} from '../../../components/atoms/Amount';
import {Button} from '../../../components/atoms/Button';
import {IconButton} from '../../../components/atoms/IconButton';
import {Select} from '../../../components/atoms/Select';
import {FormField} from '../../../components/molecules/FormField';
import {Stepper} from '../../../components/molecules/Stepper';
import {cn} from '../../../lib/cn';
import {formatAmount, formatTime} from '../../../lib/format';
import {MAX_QUANTITY} from '../constants/cashier';
import {groupByShipment, lineSubtotal, orderTitle} from '../utils/cart';
import {OrderLine} from './OrderLine';

const styles = {
  bare: 'flex flex-col gap-5',
  panel: 'flex flex-col gap-5 rounded-3xl border border-arena/40 bg-white p-4 shadow-card sm:p-5 lg:max-h-[calc(100dvh-15rem)]',
  scroll: 'flex min-h-0 flex-1 flex-col gap-5 lg:-mx-2 lg:overflow-y-auto lg:px-2',
  header: 'flex items-start justify-between gap-3',
  title: 'font-display text-3xl leading-none text-carbon',
  subtitle: 'mt-1 text-sm text-cafe',
  block: 'flex flex-col',
  blockTitle: 'flex items-center justify-between text-xs font-bold uppercase tracking-wide text-cafe',
  toggle: 'flex w-full items-center justify-between gap-2 rounded-xl bg-hueso/60 px-3 py-2.5 text-left text-sm font-semibold text-carbon transition-colors hover:bg-hueso',
  toggleMeta: 'flex items-center gap-2 text-cafe',
  chevron: 'transition-transform duration-200',
  open: 'rotate-180',
  shipment: 'mt-2 rounded-xl bg-hueso/60 px-3',
  shipmentHead: 'flex items-center justify-between gap-2 pt-2',
  shipmentTitle: 'text-xs font-semibold text-cafe',
  list: 'divide-y divide-arena/40',
  empty: 'mt-2 flex flex-col items-center gap-2 rounded-xl border border-dashed border-arena px-4 py-6 text-center text-sm text-cafe',
  lineActions: 'flex items-center gap-2',
  totals: 'flex flex-col gap-1.5 border-t border-arena/50 pt-4 text-sm text-cafe',
  totalRow: 'flex items-center justify-between',
  grandTotal: 'flex items-center justify-between pt-1 text-base font-semibold text-carbon',
};

const lineIn = {opacity: 0, x: 16};
const lineVisible = {opacity: 1, x: 0};

const unitsOf = (detalles) => detalles.reduce((total, detail) => total + detail.cantidad, 0);

const optionsOf = (waiters) => waiters.map((item) => ({value: String(item.id), label: `${item.nombre} · ${item.cargo}`}));

// Pedido de la mesa; "bare" lo muestra sin tarjeta ni título (dentro del modal del celular)
export function OrderPanel({order, bare = false}) {
  const {venta, mesa, lines, totals} = order;
  const [showRegistered, setShowRegistered] = useState(false);
  return (
    <section aria-label="Pedido de la mesa" className={bare ? styles.bare : styles.panel}>
      {!bare && (
        <header className={styles.header}>
          <div>
            <h2 className={styles.title}>{orderTitle(venta)}</h2>
            <p className={styles.subtitle}>{mesa.nombre} · {mesa.seccion.nombre}</p>
          </div>
          {venta?.modificado && <Badge tone="warning">Modificado por {venta.modificadoPor}</Badge>}
        </header>
      )}

      <FormField label="Mesero" required error={order.meseroError}>
        {(field) => (
          <Select {...field} placeholder="Elija el mesero" options={optionsOf(order.waiters)} value={order.idMesero} onChange={(event) => order.changeWaiter(event.target.value)} />
        )}
      </FormField>

      <div className={styles.scroll}>
        {venta && (
          <div className={styles.block}>
            <button type="button" aria-expanded={showRegistered} onClick={() => setShowRegistered((value) => !value)} className={styles.toggle}>
              Registrado
              <span className={styles.toggleMeta}>
                {venta.envios} {venta.envios === 1 ? 'envío' : 'envíos'} · {unitsOf(venta.detalles)} u.
                <ChevronDown size={16} aria-hidden className={cn(styles.chevron, showRegistered && styles.open)} />
              </span>
            </button>
            {showRegistered && groupByShipment(venta.detalles).map((group) => (
              <div key={group.envio} className={styles.shipment}>
                <div className={styles.shipmentHead}>
                  <p className={styles.shipmentTitle}>Envío {group.envio} · {formatTime(group.creadoEn)} · {group.mesero}</p>
                  <IconButton icon={Printer} label={`Reimprimir la comanda del envío ${group.envio}`} onClick={() => order.openPrint(group.envio)} />
                </div>
                <ul className={styles.list}>
                  {group.detalles.map((detail) => <li key={detail.id}><OrderLine line={detail} /></li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

        <div className={styles.block}>
          <h3 className={styles.blockTitle}>
            Por registrar
            {order.units > 0 && <span>{order.units} u.</span>}
          </h3>
          {lines.length === 0 ? (
            <p className={styles.empty}>
              <ShoppingBasket size={26} aria-hidden />
              Toque un producto del menú para agregarlo.
            </p>
          ) : (
            <ul aria-label="Productos por registrar" className={styles.list}>
              <AnimatePresence initial={false}>
                {lines.map((line) => (
                  <motion.li key={line.key} layout initial={lineIn} animate={lineVisible} exit={lineIn}>
                    <OrderLine
                      line={{...line, subtotal: lineSubtotal(line)}}
                      showQuantity={false}
                      actions={
                        <>
                          <Stepper label={`Cantidad de ${line.nombre}`} value={line.cantidad} max={MAX_QUANTITY} onChange={(cantidad) => order.changeQuantity(line.key, cantidad)} />
                          <span className={styles.lineActions}>
                            <IconButton icon={Pencil} tone="edit" label={`Editar ${line.nombre}`} onClick={() => order.editLine(line)} />
                            <IconButton icon={Trash2} tone="danger" label={`Quitar ${line.nombre}`} onClick={() => order.remove(line.key)} />
                          </span>
                        </>
                      }
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>

      </div>

      <div className={styles.totals}>
        {venta && (
          <span className={styles.totalRow}>Registrado <span>Bs {formatAmount(totals.registered)}</span></span>
        )}
        <span className={styles.totalRow}>Por registrar <span>Bs {formatAmount(totals.pending)}</span></span>
        <span className={styles.grandTotal}>
          Total de la mesa
          <Amount prefix="Bs" size="lg" value={formatAmount(totals.total)} />
        </span>
      </div>

      {order.submitError && <Alert tone="error">{order.submitError}</Alert>}
      <Button fullWidth icon={<Send size={18} aria-hidden />} loading={order.saving} disabled={lines.length === 0} onClick={order.submit}>
        Enviar a cocina
      </Button>
    </section>
  );
}
