import {useState} from 'react';
import {ArrowLeft, ShoppingBasket} from 'lucide-react';
import {AnimatePresence, motion} from 'motion/react';
import {Alert} from '../../../components/molecules/Alert';
import {Badge} from '../../../components/atoms/Badge';
import {Button} from '../../../components/atoms/Button';
import {Spinner} from '../../../components/atoms/Spinner';
import {Modal} from '../../../components/organisms/Modal';
import {ConfirmDialog} from '../../../components/organisms/ConfirmDialog';
import {useMediaQuery} from '../../../hooks/useMediaQuery';
import {DESKTOP_QUERY} from '../../../config/breakpoints';
import {formatAmount} from '../../../lib/format';
import {CatalogPanel} from './CatalogPanel';
import {ItemPickerModal} from './ItemPickerModal';
import {OrderPanel} from './OrderPanel';
import {KitchenTicket} from './KitchenTicket';
import {ReceiptTicket} from './ReceiptTicket';
import {CheckoutModal} from './CheckoutModal';
import {PrintPreview} from '../../../components/organisms/PrintPreview';
import {orderTitle} from '../utils/cart';

const styles = {
  page: 'flex flex-col gap-5 pb-24 lg:pb-0',
  bar: 'flex flex-wrap items-center gap-3',
  heading: 'flex min-w-0 flex-1 items-center gap-3',
  title: 'font-display text-4xl leading-none text-carbon',
  section: 'text-sm text-cafe',
  layout: 'grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]',
  aside: 'lg:sticky lg:top-4 lg:self-start',
  loading: 'flex justify-center py-16',
  mobileBar: 'fixed inset-x-4 bottom-4 z-30 flex items-center justify-between gap-3 rounded-2xl bg-carbon px-5 py-3 text-white shadow-float',
  mobileText: 'flex items-center gap-2 text-sm font-semibold',
  mobileTotal: 'font-display text-2xl leading-none',
  currency: 'font-sans text-xs font-semibold',
};

const barIn = {opacity: 0, y: 40};
const barVisible = {opacity: 1, y: 0};

export function OrderView({order, checkout, onBack}) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const back = () => {
    if (order.lines.length > 0) {
      setConfirmLeave(true);
      return;
    }
    onBack();
  };

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

  if (order.loading || !order.mesa) {
    return (
      <div className={styles.page}>
        <div className={styles.bar}>
          <Button variant="outline" size="sm" icon={<ArrowLeft size={16} aria-hidden />} onClick={onBack}>Mesas</Button>
        </div>
        {order.error && <Alert tone="error">{order.error}</Alert>}
        {order.loading && (
          <div className={styles.loading}>
            <Spinner size={32} label="Cargando mesa" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.bar}>
        <Button variant="outline" size="sm" icon={<ArrowLeft size={16} aria-hidden />} onClick={back}>Mesas</Button>
        <div className={styles.heading}>
          <h2 className={styles.title}>{order.mesa.nombre}</h2>
          <span className={styles.section}>{order.mesa.seccion.nombre} · {order.mesa.capacidad} personas</span>
          {order.venta ? <Badge tone="danger" dot>Ocupada</Badge> : <Badge tone="success" dot>Libre</Badge>}
        </div>
      </div>

      <AnimatePresence>
        {order.notice && <Alert key="notice" tone="success">{order.notice}</Alert>}
      </AnimatePresence>
      {order.stockWarning && <Alert tone="info">{order.stockWarning}</Alert>}

      <div className={styles.layout}>
        <CatalogPanel order={order} />
        {isDesktop && (
          <aside className={styles.aside}>
            <OrderPanel order={panelOrder} />
          </aside>
        )}
      </div>

      {!isDesktop && (
        <motion.button type="button" initial={barIn} animate={barVisible} onClick={() => setMobileOpen(true)} className={styles.mobileBar}>
          <span className={styles.mobileText}>
            <ShoppingBasket size={18} aria-hidden />
            Ver pedido{order.units > 0 && ` · ${order.units} por registrar`}
          </span>
          <span className={styles.mobileTotal}><span className={styles.currency}>Bs</span> {formatAmount(order.totals.total)}</span>
        </motion.button>
      )}
      {!isDesktop && (
        <Modal open={mobileOpen} onClose={() => setMobileOpen(false)} title={orderTitle(order.venta)} description={`${order.mesa.nombre} · ${order.mesa.seccion.nombre}`}>
          <OrderPanel order={panelOrder} bare />
        </Modal>
      )}

      <PrintPreview
        open={order.printing.open}
        title="Comanda de cocina"
        description={`Envío ${order.printing.envio} de ${order.mesa.nombre}: solo lo nuevo de este envío`}
        onClose={order.closePrint}
      >
        {order.venta && order.printing.envio > 0 && (
          <KitchenTicket mesa={order.mesa} venta={order.venta} envio={order.printing.envio} printedAt={order.printing.printedAt} />
        )}
      </PrintPreview>

      {order.venta && <CheckoutModal checkout={checkout} venta={order.venta} mesa={order.mesa} />}

      <PrintPreview
        open={checkout.receipt.open}
        title="Ticket de venta"
        description={`${order.mesa.nombre} quedó libre. Imprima el ticket para el cliente.`}
        autoPrint
        onClose={() => {
          checkout.closeReceipt();
          onBack();
        }}
      >
        {checkout.receipt.ticket && <ReceiptTicket ticket={checkout.receipt.ticket} printedAt={checkout.receipt.printedAt} />}
      </PrintPreview>

      <ItemPickerModal picker={order.picker} onConfirm={order.confirmPicker} onClose={order.closePicker} />

      <ConfirmDialog
        open={confirmLeave}
        title="Descartar productos"
        message={`Hay ${order.units} productos sin registrar en ${order.mesa.nombre}. Si vuelve a las mesas se descartarán.`}
        confirmLabel="Descartar y salir"
        onConfirm={onBack}
        onCancel={() => setConfirmLeave(false)}
      />
    </div>
  );
}
