import {useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {ChevronDown, Pencil, Printer, ShoppingBasket, Trash2} from 'lucide-react';
import {Amount} from '../../../components/atoms/Amount';
import {Button} from '../../../components/atoms/Button';
import {IconButton} from '../../../components/atoms/IconButton';
import {Stepper} from '../../../components/molecules/Stepper';
import {cn} from '../../../lib/cn';
import {countText, formatAmount, formatTime, formatWait} from '../../../lib/format';
import {MAX_QUANTITY} from '../constants/cashier';
import {groupByShipment, lineSubtotal, orderTitle} from '../utils/cart';
import {waitMinutes} from '../utils/kitchen';
import {OrderLine, OrderLineHeader} from './OrderLine';

const styles = {
  bare: 'flex flex-col gap-5',
  panel: 'flex flex-col gap-5 rounded-3xl border border-arena/40 bg-white p-4 shadow-card sm:p-5',
  scroll: 'flex flex-col gap-5',
  header: '-mx-4 -mt-4 rounded-t-3xl bg-carbon px-4 py-4 text-crema sm:-mx-5 sm:-mt-5 sm:px-5',
  headerTop: 'flex items-baseline justify-between gap-3',
  title: 'font-display text-3xl leading-none',
  number: 'font-display text-xl leading-none text-mostaza',
  facts: 'mt-3 grid grid-cols-3 gap-2 text-xs',
  factLabel: 'block text-crema/60',
  factValue: 'block truncate font-semibold',
  waitValue: 'block font-semibold text-mostaza',
  modified: 'mt-2 text-xs text-crema/70',
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
  hint: 'text-sm text-cafe',
  actions: 'grid grid-cols-2 gap-3',
  wide: 'col-span-2',
};

const lineIn = {opacity: 0, x: 16};
const lineVisible = {opacity: 1, x: 0};

const pendingUnits = (venta) => venta.detalles.reduce((total, detail) => total + detail.cantidad - detail.listos, 0);

const checkoutBlock = (venta, lines) => {
  if (lines.length > 0) {
    return 'Envíe a cocina o quite lo que falta registrar antes de cobrar.';
  }
  const pending = pendingUnits(venta);
  if (pending > 0) {
    return `Por salir de cocina: ${countText(pending, 'unidad', 'unidades')}. Márquelas en Marcar listos cuando salgan.`;
  }
  return '';
};

const unitsOf = (detalles) => detalles.reduce((total, detail) => total + detail.cantidad, 0);

const waitingSince = (venta) => {
  const pending = venta.detalles.filter((detail) => detail.listos < detail.cantidad).map((detail) => new Date(detail.creadoEn).getTime());
  if (pending.length === 0) {
    return null;
  }
  return Math.min(...pending);
};

function PanelHeader({mesa, venta, now}) {
  let wait = null;
  if (venta && waitingSince(venta)) {
    wait = formatWait(waitMinutes(waitingSince(venta), now));
  }
  return (
    <header className={styles.header}>
      <div className={styles.headerTop}>
        <h2 className={styles.title}>{mesa.nombre}</h2>
        <span className={styles.number}>{orderTitle(venta)}</span>
      </div>
      {venta && (
        <dl className={styles.facts}>
          <div><dt className={styles.factLabel}>Abrió</dt><dd className={styles.factValue}>{venta.cajero}</dd></div>
          <div><dt className={styles.factLabel}>Desde</dt><dd className={styles.factValue}>{formatTime(venta.abiertaEn)}</dd></div>
          <div><dt className={styles.factLabel}>Espera</dt><dd className={styles.waitValue}>{wait ?? 'Nada'}</dd></div>
        </dl>
      )}
      {venta?.modificado && <p className={styles.modified}>Modificado por {venta.modificadoPor}</p>}
    </header>
  );
}

export function OrderPanel({order, now, bare = false}) {
  const {venta, mesa, lines, totals} = order;
  const [showRegistered, setShowRegistered] = useState(true);
  return (
    <section aria-label="Pedido de la mesa" className={bare ? styles.bare : styles.panel}>
      {!bare && <PanelHeader mesa={mesa} venta={venta} now={now} />}

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
                  <p className={styles.shipmentTitle}>Envío {group.envio} · {formatTime(group.creadoEn)} · Registró: {group.cajero}</p>
                  <IconButton icon={Printer} label={`Reimprimir la comanda del envío ${group.envio}`} onClick={() => order.openPrint(group.envio)} />
                </div>
                <OrderLineHeader />
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
            <>
              <OrderLineHeader />
              <ul aria-label="Productos por registrar" className={styles.list}>
                <AnimatePresence initial={false}>
                  {lines.map((line) => (
                    <motion.li key={line.key} layout initial={lineIn} animate={lineVisible} exit={lineIn}>
                      <OrderLine
                        line={{...line, subtotal: lineSubtotal(line)}}
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
            </>
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

      {venta && checkoutBlock(venta, lines) && <p className={styles.hint}>{checkoutBlock(venta, lines)}</p>}
      <div className={styles.actions}>
        <Button fullWidth action="send" loading={order.saving} disabled={lines.length === 0} onClick={order.submit} className={styles.wide}>
          Enviar a cocina
        </Button>
        {venta && (
          <Button variant="outline" fullWidth action="ready" disabled={pendingUnits(venta) === 0} onClick={order.openReady}>
            Marcar listos
          </Button>
        )}
        {venta && (
          <Button variant="dark" fullWidth action="charge" disabled={Boolean(checkoutBlock(venta, lines))} onClick={order.startCheckout}>
            Cobrar
          </Button>
        )}
      </div>
    </section>
  );
}
