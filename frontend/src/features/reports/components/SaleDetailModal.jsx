import {Badge} from '../../../components/atoms/Badge';
import {Button} from '../../../components/atoms/Button';
import {Modal} from '../../../components/organisms/Modal';
import {countText, formatAmount, formatDayMonthYear, formatTime} from '../../../lib/format';
import {isoDate} from '../utils/reports';

const styles = {
  layout: 'grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]',
  shipments: 'flex flex-col gap-3',
  shipment: 'overflow-hidden rounded-2xl border border-arena/50 bg-white',
  shipmentHead: 'flex flex-wrap items-center gap-2 border-b border-arena/40 px-4 py-2 text-xs font-semibold text-cafe',
  shipmentTag: 'rounded-full bg-carbon px-2 py-0.5 text-[11px] font-bold text-crema',
  lines: 'divide-y divide-arena/30',
  line: 'flex items-start gap-3 px-4 py-2.5',
  qty: 'flex size-7 shrink-0 items-center justify-center rounded-lg bg-hueso font-display text-base text-carbon',
  text: 'min-w-0 flex-1',
  name: 'flex flex-wrap items-center gap-1.5 text-sm font-semibold text-carbon',
  combo: 'block text-xs text-cafe',
  removed: 'block text-xs font-medium text-rojo',
  subtotal: 'text-sm font-semibold tabular-nums text-carbon',
  aside: 'flex flex-col gap-2.5 self-start rounded-2xl border border-arena/50 bg-white p-4 text-sm',
  asideTitle: 'text-xs font-bold uppercase tracking-wider text-cafe',
  row: 'flex justify-between gap-3',
  label: 'text-cafe',
  amount: 'tabular-nums text-carbon',
  totalRow: 'flex justify-between gap-3 border-t border-arena/50 pt-2 font-semibold text-carbon',
  small: 'flex justify-between gap-3 text-xs text-cafe',
  note: 'border-t border-arena/50 pt-2 text-xs text-cafe',
  strong: 'font-semibold text-carbon',
  actions: 'grid gap-3 sm:grid-cols-2',
};

// "Ticket sin imprimir", "Ticket impreso 1 vez" o "Ticket impreso 4 veces"
const printsText = (count) => {
  if (count === 0) {
    return 'Ticket sin imprimir';
  }
  return `Ticket impreso ${countText(count, 'vez', 'veces')}`;
};

const when = (date) => `${formatDayMonthYear(isoDate(new Date(date)))} · ${formatTime(date)}`;

function Shipment({envio}) {
  return (
    <section aria-label={`Envío ${envio.numero}`} className={styles.shipment}>
      <p className={styles.shipmentHead}>
        <span className={styles.shipmentTag}>Envío {envio.numero}</span>
        {formatTime(envio.creadoEn)} · Registró: {envio.cajero}
      </p>
      <ul className={styles.lines}>
        {envio.lineas.map((line, index) => (
          <li key={`${line.nombre}-${index}`} className={styles.line}>
            <span className={styles.qty}>{line.cantidad}</span>
            <span className={styles.text}>
              <span className={styles.name}>
                {line.nombre}
                {line.tipo === 'promocion' && <Badge tone="brand">Promoción</Badge>}
                {line.consumo === 'llevar' && <Badge tone="warning">Para llevar</Badge>}
              </span>
              {line.productos && <span className={styles.combo}>{line.productos}</span>}
              {line.sin && <span className={styles.removed}>{line.sin}</span>}
            </span>
            <span className={styles.subtotal}>Bs {formatAmount(line.subtotal)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Payment({sale}) {
  return (
    <aside aria-label="Cobro" className={styles.aside}>
      <p className={styles.asideTitle}>Cobro</p>
      <p className={styles.row}><span className={styles.label}>Efectivo</span><span className={styles.amount}>Bs {formatAmount(sale.efectivo)}</span></p>
      <p className={styles.row}><span className={styles.label}>QR</span><span className={styles.amount}>Bs {formatAmount(sale.qr)}</span></p>
      <p className={styles.totalRow}><span>Total</span><span>Bs {formatAmount(sale.total)}</span></p>
      {sale.recibido !== null && (
        <p className={styles.small}><span>Recibido Bs {formatAmount(sale.recibido)}</span><span>Cambio Bs {formatAmount(sale.cambio)}</span></p>
      )}
      <p className={styles.note}>Cobró <span className={styles.strong}>{sale.cobrador ?? '—'}</span> el {when(sale.cerradaEn)}</p>
      <p className={styles.small}>
        <span>
          {printsText(sale.impresiones)}
          {sale.autorizaciones.map((item) => ` · la ${item.numero}.ª la autorizó ${item.autorizadoPor}`).join('')}
        </span>
      </p>
    </aside>
  );
}

// Detalle de una venta del reporte: productos por envío y el cobro; con Caja se puede reimprimir el ticket
export function SaleDetailModal({sale, onClose, onReprint}) {
  return (
    <Modal
      open={Boolean(sale)}
      onClose={onClose}
      title={sale ? `Venta Nº ${sale.numero} · Bs ${formatAmount(sale.total)}` : ''}
      description={sale && `${when(sale.abiertaEn)} a ${formatTime(sale.cerradaEn)} · ${sale.mesa} · ${sale.seccion} · Abrió ${sale.abrio}`}
      size="xl"
      footer={(
        <div className={styles.actions}>
          <Button variant="outline" action="close" onClick={onClose}>Cerrar</Button>
          {onReprint && <Button variant="dark" action="print" onClick={() => onReprint(sale)}>Reimprimir ticket</Button>}
        </div>
      )}
    >
      {sale && (
        <div className={styles.layout}>
          <div className={styles.shipments}>{sale.envios.map((envio) => <Shipment key={envio.numero} envio={envio} />)}</div>
          <Payment sale={sale} />
        </div>
      )}
    </Modal>
  );
}
