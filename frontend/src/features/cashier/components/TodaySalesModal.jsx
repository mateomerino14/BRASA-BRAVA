import {ExternalLink, Pencil, Printer} from 'lucide-react';
import {Modal} from '../../../components/organisms/Modal';
import {PrintPreview} from '../../../components/organisms/PrintPreview';
import {Alert} from '../../../components/molecules/Alert';
import {FormField} from '../../../components/molecules/FormField';
import {Button} from '../../../components/atoms/Button';
import {IconButton} from '../../../components/atoms/IconButton';
import {Input} from '../../../components/atoms/Input';
import {Spinner} from '../../../components/atoms/Spinner';
import {countText, formatAmount, formatTime} from '../../../lib/format';
import {PAYMENT_LABELS} from '../utils/checkout';
import {ReceiptTicket} from './ReceiptTicket';

const styles = {
  body: 'flex flex-col gap-5',
  totals: 'grid grid-cols-2 gap-2 sm:grid-cols-4',
  tile: 'flex flex-col gap-0.5 rounded-card border border-arena/50 bg-white px-3 py-2',
  tileLabel: 'text-xs font-semibold text-cafe',
  tileValue: 'font-display text-2xl leading-none text-carbon',
  list: 'flex max-h-[45dvh] flex-col divide-y divide-arena/40 overflow-y-auto rounded-card border border-arena/50 bg-white',
  row: 'flex items-center justify-between gap-3 px-3 py-2.5',
  rowText: 'flex min-w-0 flex-col',
  rowTitle: 'text-sm font-semibold text-carbon',
  rowMeta: 'text-xs text-cafe',
  rowEnd: 'flex shrink-0 items-center gap-3',
  amount: 'text-sm font-semibold tabular-nums text-carbon',
  empty: 'rounded-card border border-dashed border-arena bg-white px-4 py-8 text-center text-sm text-cafe',
  loading: 'flex justify-center py-10',
  link: 'flex flex-wrap items-center gap-2',
  anchor: 'inline-flex items-center gap-1.5 text-sm font-semibold text-brasa underline-offset-4 hover:underline',
  linkForm: 'flex flex-col gap-3',
  linkActions: 'grid gap-3 sm:grid-cols-2',
};

const paymentText = (pagos) => pagos.map((item) => PAYMENT_LABELS[item.metodo]).join(' + ');

// Ventas cobradas hoy con totales por método, reimpresión del ticket y enlace a impuestos
export function TodaySalesModal({sales, canEditLink}) {
  const {resumen} = sales;
  const tiles = [
    ['Ventas', String(resumen.cantidad)],
    ['Total Bs', formatAmount(resumen.total)],
    ['Efectivo Bs', formatAmount(resumen.efectivo)],
    ['QR Bs', formatAmount(resumen.qr)],
  ];
  return (
    <>
      <Modal open={sales.open} onClose={sales.close} title="Ventas de hoy" description={`${countText(resumen.cantidad, 'venta cobrada', 'ventas cobradas')}`} size="lg">
        <div className={styles.body}>
          {sales.error && <Alert tone="error">{sales.error}</Alert>}
          {sales.loading ? (
            <div className={styles.loading}><Spinner size={28} label="Cargando ventas" /></div>
          ) : (
            <>
              <section aria-label="Totales del día" className={styles.totals}>
                {tiles.map(([label, value]) => (
                  <div key={label} className={styles.tile}>
                    <span className={styles.tileLabel}>{label}</span>
                    <span className={styles.tileValue}>{value}</span>
                  </div>
                ))}
              </section>
              {sales.ventas.length === 0 ? (
                <p className={styles.empty}>Todavía no se cobró ninguna venta hoy.</p>
              ) : (
                <ul aria-label="Ventas cobradas" className={styles.list}>
                  {sales.ventas.map((sale) => (
                    <li key={sale.id} className={styles.row}>
                      <span className={styles.rowText}>
                        <span className={styles.rowTitle}>Nº {sale.numero} · {sale.mesa}</span>
                        <span className={styles.rowMeta}>{formatTime(sale.cerradaEn)} · {paymentText(sale.pagos)} · {sale.cobrador}</span>
                      </span>
                      <span className={styles.rowEnd}>
                        <span className={styles.amount}>Bs {formatAmount(sale.total)}</span>
                        <IconButton icon={Printer} label={`Reimprimir el ticket del pedido ${sale.numero}`} onClick={() => sales.reprint(sale)} />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {sales.linkDraft === null ? (
            <div className={styles.link}>
              {sales.taxLink && (
                <a href={sales.taxLink} target="_blank" rel="noopener noreferrer" className={styles.anchor}>
                  <ExternalLink size={15} aria-hidden />
                  Página de impuestos
                </a>
              )}
              {canEditLink && <IconButton icon={Pencil} tone="edit" label="Cambiar el enlace de impuestos" onClick={sales.editLink} />}
            </div>
          ) : (
            <div className={styles.linkForm}>
              <FormField label="Enlace de la página de impuestos" error={sales.linkError}>
                {(field) => <Input {...field} type="url" value={sales.linkDraft} onChange={(event) => sales.changeLink(event.target.value)} />}
              </FormField>
              <div className={styles.linkActions}>
                <Button variant="outline" size="sm" onClick={sales.cancelLink}>Cancelar</Button>
                <Button size="sm" loading={sales.savingLink} onClick={sales.saveLink}>Guardar enlace</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <PrintPreview open={sales.receipt.open} title="Ticket de venta" description="Reimpresión" onClose={sales.closeReceipt}>
        {sales.receipt.ticket && <ReceiptTicket ticket={sales.receipt.ticket} printedAt={sales.receipt.printedAt} />}
      </PrintPreview>
    </>
  );
}
