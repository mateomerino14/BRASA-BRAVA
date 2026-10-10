import {useSearchParams} from 'react-router';
import {useAuth} from '../../../context/useAuth';
import {FloorView} from '../components/FloorView';
import {OrderView} from '../components/OrderView';
import {useFloor} from '../hooks/useFloor';
import {useTableOrder} from '../hooks/useTableOrder';
import {useCheckout} from '../hooks/useCheckout';
import {useTodaySales} from '../hooks/useTodaySales';
import {KitchenTicket} from '../components/KitchenTicket';
import {PrinterTestTicket} from '../components/PrinterTestTicket';
import {usePrinterSettings} from '../hooks/usePrinterSettings';
import {useDesktopPrinters} from '../../../hooks/useDesktopPrinters';
import {printOnDesktop} from '../../../lib/desktopPrinting';

function FloorScreen({sectionId, onSectionChange, onOpenTable}) {
  const {user} = useAuth();
  const floor = useFloor({sectionId, onSectionChange});
  const sales = useTodaySales();
  const printerSettings = usePrinterSettings({testDocument: (destino, printer) => <PrinterTestTicket destino={destino} printer={printer} printedAt={new Date()} />});
  const canEditLink = Boolean(user?.isDirectorio || user?.permissions?.includes('administracion'));
  return <FloorView floor={floor} sales={sales} printerSettings={printerSettings} canEditLink={canEditLink} onOpenTable={onOpenTable} />;
}

function OrderScreen({idMesa, onBack}) {
  const {user} = useAuth();
  const {printers} = useDesktopPrinters();
  let printKitchen;
  if (printers.cocina) {
    printKitchen = ({mesa, venta, envio, printedAt}) => printOnDesktop('cocina', <KitchenTicket mesa={mesa} venta={venta} envio={envio} printedAt={printedAt} />);
  }
  const order = useTableOrder({idMesa, user, printKitchen});
  const checkout = useCheckout({idMesa, total: order.venta?.total ?? 0});
  return <OrderView order={order} checkout={checkout} onBack={onBack} />;
}

// Caja: plano de mesas por sección y, al elegir una, el armado de su pedido; la mesa y la sección viven en la URL
export function CashierPage() {
  const [params, setParams] = useSearchParams();
  const idMesa = params.get('mesa');
  const sectionId = params.get('seccion');

  const update = (changes, options) => {
    setParams((current) => {
      const next = new URLSearchParams(current);
      for (const [key, value] of Object.entries(changes)) {
        if (value) {
          next.set(key, value);
        }
        else {
          next.delete(key);
        }
      }
      return next;
    }, options);
  };

  if (idMesa) {
    return <OrderScreen key={idMesa} idMesa={Number(idMesa)} onBack={() => update({mesa: null})} />;
  }
  return (
    <FloorScreen
      sectionId={sectionId}
      onSectionChange={(id) => update({seccion: id}, {replace: true})}
      onOpenTable={(mesa) => update({mesa: String(mesa.id)})}
    />
  );
}
