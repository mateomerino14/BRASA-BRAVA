import {formatAmount, formatTime} from '../../../lib/format';
import {PAYMENT_LABELS} from '../utils/checkout';

const styles = {
  ticket: 'font-mono text-[13px] leading-snug text-black',
  brand: 'text-center text-base font-bold tracking-widest',
  title: 'text-center font-bold',
  center: 'text-center',
  modified: 'my-1 text-center font-bold',
  rule: 'my-2 border-t border-dashed border-black',
  head: 'flex font-bold',
  line: 'flex',
  qty: 'w-9 shrink-0',
  name: 'flex-1 break-words pr-2',
  type: 'w-7 shrink-0',
  amount: 'w-20 shrink-0 text-right tabular-nums',
  row: 'flex justify-between',
  total: 'flex justify-between text-base font-bold',
};

const dateFormatter = new Intl.DateTimeFormat('es-BO', {day: '2-digit', month: '2-digit', year: 'numeric'});

// Ticket de venta: todo lo acumulado de la mesa con precios, total, pagos y cambio
export function ReceiptTicket({ticket, printedAt}) {
  return (
    <article aria-label={`Ticket del pedido ${ticket.numero}`} className={styles.ticket}>
      <p className={styles.brand}>BRASA BRAVA</p>
      <p className={styles.title}>TICKET DE VENTA</p>
      {ticket.modificadoPor && <p className={styles.modified}>*** MODIFICADO POR: {ticket.modificadoPor.toUpperCase()} ***</p>}
      <div className={styles.rule} />
      <p>Fecha: {dateFormatter.format(printedAt)} · Hora: {formatTime(printedAt)}</p>
      <p>Nro. Venta: {ticket.numero}</p>
      <p>{ticket.mesa} · {ticket.seccion}</p>
      <p>Mesero: {ticket.mesero}</p>
      <p>Cajero: {ticket.cobrador ?? ticket.cajero}</p>
      <div className={styles.rule} />
      <p className={styles.head}>
        <span className={styles.qty}>CANT</span>
        <span className={styles.name}>DESCRIPCIÓN</span>
        <span className={styles.type}>T</span>
        <span className={styles.amount}>SUBTOTAL</span>
      </p>
      {ticket.lineas.map((line) => (
        <p key={`${line.nombre}-${line.precioUnitario}-${line.consumo}`} className={styles.line}>
          <span className={styles.qty}>{line.cantidad}</span>
          <span className={styles.name}>{line.nombre}</span>
          <span className={styles.type}>{line.consumo === 'llevar' ? 'LL' : 'L'}</span>
          <span className={styles.amount}>{formatAmount(line.subtotal)}</span>
        </p>
      ))}
      <div className={styles.rule} />
      <p className={styles.total}><span>TOTAL</span><span>Bs {formatAmount(ticket.total)}</span></p>
      {ticket.pagos.length > 0 && <div className={styles.rule} />}
      {ticket.pagos.map((pago) => (
        <p key={pago.metodo} className={styles.row}><span>{PAYMENT_LABELS[pago.metodo]}</span><span>Bs {formatAmount(pago.monto)}</span></p>
      ))}
      {ticket.recibido !== null && ticket.recibido !== undefined && (
        <>
          <p className={styles.row}><span>Recibido</span><span>Bs {formatAmount(ticket.recibido)}</span></p>
          <p className={styles.row}><span>Cambio</span><span>Bs {formatAmount(ticket.cambio)}</span></p>
        </>
      )}
      <div className={styles.rule} />
      <p className={styles.center}>¡Gracias por su visita!</p>
    </article>
  );
}
