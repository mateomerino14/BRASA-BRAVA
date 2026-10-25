import {useCallback, useEffect, useRef, useState} from 'react';
import {useSearchParams} from 'react-router';
import {useAuth} from '../../../context/useAuth';
import {useToast} from '../../../context/useToast';
import {Spinner} from '../../../components/atoms/Spinner';
import {ConfirmDialog} from '../../../components/organisms/ConfirmDialog';
import {useDesktopPrinters} from '../../../hooks/useDesktopPrinters';
import {printOnDesktop} from '../../../lib/desktopPrinting';
import {TablesBar} from '../components/TablesBar';
import {TableWorkspace} from '../components/TableWorkspace';
import {TodaySalesModal} from '../components/TodaySalesModal';
import {PrintersModal} from '../components/PrintersModal';
import {PrintAuthorizationModal} from '../components/PrintAuthorizationModal';
import {KitchenTicket} from '../components/KitchenTicket';
import {PrinterTestTicket} from '../components/PrinterTestTicket';
import {useFloor} from '../hooks/useFloor';
import {useTableOrder} from '../hooks/useTableOrder';
import {useCheckout} from '../hooks/useCheckout';
import {useTodaySales} from '../hooks/useTodaySales';
import {usePrinterSettings} from '../hooks/usePrinterSettings';
import {usePrintAuthorization} from '../hooks/usePrintAuthorization';

const styles = {
  page: 'flex flex-col gap-5',
  loading: 'flex justify-center py-16',
  empty: 'rounded-card border border-dashed border-arena bg-white px-4 py-10 text-center text-sm text-cafe',
};

const testDocument = (destino, printer) => <PrinterTestTicket destino={destino} printer={printer} printedAt={new Date()} />;

// Pedido y menú de la mesa elegida; se monta de nuevo al cambiar de mesa. Avisa cuántas unidades quedan sin enviar
function Workspace({idMesa, now, authorizePrint, onChanged, onCheckedOut, onPendingChange}) {
  const {printers} = useDesktopPrinters();
  let printKitchen;
  if (printers.cocina) {
    printKitchen = ({mesa, venta, envio, printedAt}) => printOnDesktop('cocina', <KitchenTicket mesa={mesa} venta={venta} envio={envio} printedAt={printedAt} />);
  }
  const order = useTableOrder({idMesa, printKitchen, onChanged});
  const checkout = useCheckout({idMesa, total: order.venta?.total ?? 0});
  useEffect(() => {
    onPendingChange(order.units);
  }, [order.units, onPendingChange]);
  return <TableWorkspace order={order} checkout={checkout} now={now} authorizePrint={authorizePrint} onCheckedOut={onCheckedOut} />;
}

// Caja en una sola pantalla, como en cafebar: secciones y mesas arriba, el pedido de la mesa a la izquierda y el menú
// a la derecha. Cocina solo recibe la comanda impresa; el cajero marca lo que sale y cobra. Mesa y sección viven en la URL
export function CashierPage() {
  const {user} = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const idMesa = params.get('mesa');
  const pendingRef = useRef(0);
  const [switchTo, setSwitchTo] = useState(null);

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

  const floor = useFloor({sectionId: params.get('seccion'), onSectionChange: (id) => update({seccion: id}, {replace: true})});
  const sales = useTodaySales();
  const printerSettings = usePrinterSettings({testDocument});
  const authorization = usePrintAuthorization();
  const canEditLink = Boolean(user?.isDirectorio || user?.permissions?.includes('administracion'));

  const trackPending = useCallback((units) => {
    pendingRef.current = units;
  }, []);

  const openTable = (mesa) => {
    pendingRef.current = 0;
    update({mesa: String(mesa.id)});
  };

  // Cambiar de mesa con productos sin enviar pide confirmación para no perderlos sin querer
  const selectTable = (mesa) => {
    if (String(mesa.id) === idMesa) {
      return;
    }
    if (pendingRef.current > 0) {
      setSwitchTo({mesa, units: pendingRef.current});
      return;
    }
    openTable(mesa);
  };

  const checkedOut = () => {
    pendingRef.current = 0;
    update({mesa: null});
    floor.reload();
    toast.success('La mesa quedó libre');
  };

  let workspace = null;
  if (floor.loading) {
    workspace = <div className={styles.loading}><Spinner size={32} label="Cargando mesas" /></div>;
  }
  else if (!floor.section && !floor.error) {
    workspace = <p className={styles.empty}>No hay secciones activas. Créelas en Administración, Secciones.</p>;
  }
  else {
    workspace = (
      <Workspace
        key={idMesa ?? 'sin-mesa'}
        idMesa={idMesa ? Number(idMesa) : null}
        now={floor.now}
        authorizePrint={authorization.authorize}
        onChanged={floor.reload}
        onCheckedOut={checkedOut}
        onPendingChange={trackPending}
      />
    );
  }

  return (
    <div className={styles.page}>
      <TablesBar
        floor={floor}
        selectedId={idMesa ? Number(idMesa) : null}
        onSelectTable={selectTable}
        onShowSales={sales.show}
        onShowPrinters={printerSettings.isDesktop ? printerSettings.show : undefined}
      />
      {workspace}

      <TodaySalesModal sales={sales} canEditLink={canEditLink} authorizePrint={authorization.authorize} />
      {printerSettings.isDesktop && <PrintersModal settings={printerSettings} />}
      <PrintAuthorizationModal authorization={authorization} />
      <ConfirmDialog
        open={Boolean(switchTo)}
        title="Descartar productos"
        message={`Hay ${switchTo?.units ?? 0} productos sin enviar a cocina. Si cambia a ${switchTo?.mesa.nombre ?? 'otra mesa'} se descartarán.`}
        confirmLabel="Descartar y cambiar"
        onConfirm={() => {
          openTable(switchTo.mesa);
          setSwitchTo(null);
        }}
        onCancel={() => setSwitchTo(null)}
      />
    </div>
  );
}
