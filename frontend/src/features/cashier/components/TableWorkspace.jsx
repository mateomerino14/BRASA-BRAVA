import {useState} from 'react';
import {Armchair, ShoppingBasket} from 'lucide-react';
import {motion} from 'motion/react';
import {Button} from '../../../components/atoms/Button';
import {Spinner} from '../../../components/atoms/Spinner';
import {Modal} from '../../../components/organisms/Modal';
import {PrintPreview} from '../../../components/organisms/PrintPreview';
import {useMediaQuery} from '../../../hooks/useMediaQuery';
import {DESKTOP_QUERY} from '../../../config/breakpoints';
import {formatAmount} from '../../../lib/format';
import {orderTitle} from '../utils/cart';
import {CatalogPanel} from './CatalogPanel';
import {CheckoutModal} from './CheckoutModal';
import {ItemPickerModal} from './ItemPickerModal';
import {KitchenTicket} from './KitchenTicket';
import {OrderPanel} from './OrderPanel';
import {ReadyModal} from './ReadyModal';
import {ReceiptTicket} from './ReceiptTicket';

const styles = {
  layout: 'grid gap-5 pb-24 lg:grid-cols-[380px_minmax(0,1fr)] lg:pb-0 xl:grid-cols-[420px_minmax(0,1fr)]',
  aside: 'lg:sticky lg:top-4 lg:self-start',
  placeholder: 'flex flex-col items-center gap-3 rounded-3xl border border-dashed border-arena bg-white px-6 py-12 text-center text-sm text-cafe',
  placeholderTitle: 'font-display text-2xl leading-none text-carbon',
  loading: 'flex justify-center py-16',
  mobileBar: 'fixed inset-x-4 bottom-4 z-30 flex items-center justify-between gap-3 rounded-2xl bg-carbon px-5 py-3 text-white shadow-float',
  mobileText: 'flex items-center gap-2 text-sm font-semibold',
  mobileTotal: 'font-display text-2xl leading-none',
  currency: 'font-sans text-xs font-semibold',
};

const barIn = {opacity: 0, y: 40};
const barVisible = {opacity: 1, y: 0};

function NoTable() {
  return (
    <div className={styles.placeholder}>
      <Armchair size={32} aria-hidden />
      <p className={styles.placeholderTitle}>Elija una mesa</p>
      <p>Toque una mesa en la barra de arriba para ver su pedido, agregar productos o cobrar.</p>
    </div>
  );
}

// Pedido de la mesa elegida a la izquierda y el menú a la derecha; en el celular el pedido se abre desde la barra de abajo
export function TableWorkspace({order, checkout, now, authorizePrint, onCheckedOut}) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (order.loading) {
    return (
      <div className={styles.loading}>
        <Spinner size={32} label="Cargando el menú" />
      </div>
    );
  }

  const submit = async () => {
    if (await order.submit()) {
      setMobileOpen(false);
    }
  };
  const startCheckout = () => {
    setMobileOpen(false);
    checkout.start();
  };
  const panelOrder = {...order, submit, startCheckout};
  const {mesa} = order;
  const ticket = checkout.receipt.ticket;

  return (
    <>
      <div className={styles.layout}>
        {isDesktop && (
          <aside className={styles.aside}>
            {mesa ? <OrderPanel order={panelOrder} now={now} /> : <NoTable />}
          </aside>
        )}
        <CatalogPanel order={order} />
      </div>

      {!isDesktop && mesa && (
        <motion.button type="button" initial={barIn} animate={barVisible} onClick={() => setMobileOpen(true)} className={styles.mobileBar}>
          <span className={styles.mobileText}>
            <ShoppingBasket size={18} aria-hidden />
            {mesa.nombre}{order.units > 0 && ` · ${order.units} por registrar`}
          </span>
          <span className={styles.mobileTotal}><span className={styles.currency}>Bs</span> {formatAmount(order.totals.total)}</span>
        </motion.button>
      )}
      {!isDesktop && mesa && (
        <Modal
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          title={orderTitle(order.venta)}
          description={`${mesa.nombre} · ${mesa.seccion.nombre}`}
          footer={<Button variant="outline" action="close" fullWidth onClick={() => setMobileOpen(false)}>Cerrar</Button>}
        >
          <OrderPanel order={panelOrder} now={now} bare />
        </Modal>
      )}

      {mesa && (
        <PrintPreview
          open={order.printing.open}
          title="Comanda de cocina"
          description={`Envío ${order.printing.envio} de ${mesa.nombre}: solo lo nuevo de este envío`}
          destino="cocina"
          onClose={order.closePrint}
        >
          {order.venta && order.printing.envio > 0 && (
            <KitchenTicket mesa={mesa} venta={order.venta} envio={order.printing.envio} printedAt={order.printing.printedAt} />
          )}
        </PrintPreview>
      )}

      {mesa && order.venta && <CheckoutModal checkout={checkout} venta={order.venta} mesa={mesa} />}

      {mesa && (
        <ReadyModal
          open={order.readyOpen}
          mesa={mesa}
          venta={order.venta}
          busy={order.marking}
          onMark={order.markReady}
          onMarkAll={order.markAllReady}
          onClose={order.closeReady}
        />
      )}

      <PrintPreview
        open={checkout.receipt.open}
        title="Ticket de venta"
        description={ticket && `${ticket.mesa} quedó libre. Imprima el ticket para el cliente.`}
        destino="caja"
        autoPrint
        guard={ticket ? () => authorizePrint(ticket) : undefined}
        onClose={() => {
          checkout.closeReceipt();
          onCheckedOut();
        }}
      >
        {ticket && <ReceiptTicket ticket={ticket} printedAt={checkout.receipt.printedAt} />}
      </PrintPreview>

      <ItemPickerModal picker={order.picker} onConfirm={order.confirmPicker} onClose={order.closePicker} />
    </>
  );
}
