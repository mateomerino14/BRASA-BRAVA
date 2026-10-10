import {Banknote, ExternalLink, QrCode, SplitSquareHorizontal} from 'lucide-react';
import {Modal} from '../../../components/organisms/Modal';
import {Alert} from '../../../components/molecules/Alert';
import {FormField} from '../../../components/molecules/FormField';
import {SegmentedControl} from '../../../components/molecules/SegmentedControl';
import {Amount} from '../../../components/atoms/Amount';
import {Button} from '../../../components/atoms/Button';
import {MoneyInput} from '../../../components/atoms/MoneyInput';
import {formatAmount} from '../../../lib/format';
import {addAmounts} from '../utils/cart';
import {cashSuggestions, parseCashSplit, receiptLines} from '../utils/checkout';
import {ReceiptTicket} from './ReceiptTicket';

const styles = {
  layout: 'grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]',
  paper: 'max-h-[50dvh] overflow-y-auto rounded-lg border border-arena/60 bg-white p-4 shadow-card md:max-h-[60dvh]',
  form: 'flex flex-col gap-4',
  total: 'flex items-center justify-between rounded-card bg-carbon px-4 py-3 text-white',
  totalLabel: 'text-sm font-semibold uppercase tracking-wide text-white/70',
  quick: 'flex flex-wrap gap-2',
  chip: 'rounded-full border border-arena bg-white px-3 py-1 text-sm font-semibold text-carbon transition-colors hover:border-brasa hover:text-brasa',
  change: 'flex items-center justify-between rounded-card bg-verde/10 px-4 py-3 text-verde',
  changeLabel: 'text-sm font-semibold',
  qrPart: 'flex items-center justify-between rounded-card bg-hueso px-4 py-2 text-sm text-carbon',
  actions: 'grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)]',
  link: 'inline-flex items-center gap-1.5 self-start text-sm font-semibold text-brasa underline-offset-4 hover:underline',
};

const METHODS = [
  {value: 'efectivo', label: 'Efectivo', icon: Banknote},
  {value: 'qr', label: 'QR', icon: QrCode},
  {value: 'mixto', label: 'Mixto', icon: SplitSquareHorizontal},
];

// Cobro de la mesa: vista previa del ticket, método de pago, efectivo recibido y cambio
export function CheckoutModal({checkout, venta, mesa}) {
  const {values, errors} = checkout;
  const total = venta.total;
  const preview = {
    numero: venta.numero, mesa: mesa.nombre, seccion: mesa.seccion.nombre, mesero: venta.mesero.nombre, cajero: venta.cajero,
    modificadoPor: venta.modificadoPor, total, lineas: receiptLines(venta.detalles), pagos: [], recibido: null,
  };
  const cash = parseCashSplit(values, total);
  return (
    <Modal open={checkout.open} onClose={checkout.close} title={`Cobrar ${mesa.nombre}`} description={`Pedido Nº ${venta.numero}`} size="lg">
      <div className={styles.layout}>
        <section aria-label="Vista previa del ticket" className={styles.paper}>
          <ReceiptTicket ticket={preview} printedAt={new Date()} />
        </section>

        <div className={styles.form}>
          <div className={styles.total}>
            <span className={styles.totalLabel}>Total a cobrar</span>
            <Amount prefix="Bs" size="lg" value={formatAmount(total)} valueClassName="text-white" />
          </div>

          <SegmentedControl label="Método de pago" options={METHODS} value={values.metodo} onChange={(metodo) => checkout.change({metodo, recibido: '', efectivo: ''})} />

          {values.metodo === 'mixto' && (
            <>
              <FormField label="Parte en efectivo" required error={errors.efectivo}>
                {(field) => <MoneyInput {...field} value={values.efectivo} onChange={(event) => checkout.change({efectivo: event.target.value})} />}
              </FormField>
              {cash.qr > 0 && <p className={styles.qrPart}><span>Parte por QR</span><strong>Bs {formatAmount(cash.qr)}</strong></p>}
            </>
          )}

          {values.metodo !== 'qr' && (
            <FormField label="Efectivo recibido" hint="Déjelo vacío si paga exacto" error={errors.recibido}>
              {(field) => <MoneyInput {...field} value={values.recibido} onChange={(event) => checkout.change({recibido: event.target.value})} />}
            </FormField>
          )}
          {values.metodo === 'efectivo' && (
            <div className={styles.quick} role="group" aria-label="Montos rápidos">
              {cashSuggestions(total).map((amount) => (
                <button key={amount} type="button" className={styles.chip} onClick={() => checkout.change({recibido: formatAmount(amount)})}>
                  {amount === total ? 'Exacto' : `Bs ${formatAmount(amount)}`}
                </button>
              ))}
            </div>
          )}

          {values.metodo !== 'qr' && checkout.cambio > 0 && (
            <p className={styles.change}>
              <span className={styles.changeLabel}>Cambio</span>
              <Amount prefix="Bs" value={formatAmount(checkout.cambio)} valueClassName="text-verde" />
            </p>
          )}

          {checkout.taxLink && (
            <a href={checkout.taxLink} target="_blank" rel="noopener noreferrer" className={styles.link}>
              <ExternalLink size={15} aria-hidden />
              Página de impuestos
            </a>
          )}

          {checkout.error && <Alert tone="error">{checkout.error}</Alert>}
          <div className={styles.actions}>
            <Button variant="outline" onClick={checkout.close} disabled={checkout.saving}>Cancelar</Button>
            <Button onClick={checkout.confirm} loading={checkout.saving}>Cobrar Bs {formatAmount(addAmounts(total))}</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
