import {Link} from 'react-router';
import {CountUp} from '../../../components/atoms/CountUp';
import {formatAmount} from '../../../lib/format';
import {cn} from '../../../lib/cn';
import {waitMinutes, waitTone} from '../../cashier/utils/kitchen';

const styles = {
  section: 'flex flex-col gap-3',
  header: 'flex flex-wrap items-baseline justify-between gap-2',
  title: 'font-display text-3xl text-carbon',
  hint: 'text-sm text-cafe',
  board: 'overflow-hidden rounded-2xl border border-arena/60 bg-white shadow-card',
  row: 'grid grid-cols-2 lg:grid-cols-[150px_repeat(4,minmax(0,1fr))]',
  divided: 'border-t border-dashed border-arena',
  head: 'col-span-2 flex items-center justify-between gap-3 bg-hueso px-5 py-3 lg:col-span-1 lg:flex-col lg:items-start lg:justify-between lg:py-4',
  headTitle: 'font-display text-3xl leading-none text-carbon',
  headLink: 'text-sm font-semibold text-brasa-oscuro underline underline-offset-4 transition-colors hover:text-carbon',
  cell: 'min-w-0 border-t border-arena/50 px-5 py-4 [&:nth-child(odd)]:border-l lg:border-l lg:border-t-0',
  value: 'flex items-baseline gap-1.5 whitespace-nowrap font-display text-4xl leading-[0.9] tabular-nums text-carbon lg:text-[2.75rem]',
  affix: 'font-sans text-[13px] font-semibold text-cafe',
  label: 'mt-1.5 text-[13px] leading-snug text-cafe',
  bar: 'mt-3 block h-1 overflow-hidden rounded-full bg-hueso',
  fill: 'block h-full rounded-full',
  fills: {brand: 'bg-brasa', success: 'bg-verde', warning: 'bg-mostaza'},
  tones: {success: 'text-verde', warning: 'text-brasa-oscuro', danger: 'text-error'},
  skeleton: 'h-[106px] animate-pulse bg-hueso',
  error: 'text-sm font-medium text-error',
};

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 1440;
const FULL = 100;

const pluralWord = (count, one, many) => {
  if (count === 1) {
    return one;
  }
  return many;
};

const share = (part, total) => {
  if (!total) {
    return 0;
  }
  return Math.round((part / total) * FULL);
};

const waitParts = (minutes) => {
  if (minutes < MINUTES_PER_HOUR) {
    return {value: minutes, suffix: 'min', format: Math.round};
  }
  if (minutes < MINUTES_PER_DAY) {
    return {value: minutes / MINUTES_PER_HOUR, suffix: 'h', format: (hours) => hours.toFixed(1).replace('.', ',')};
  }
  const days = Math.floor(minutes / MINUTES_PER_DAY);
  return {value: days, suffix: pluralWord(days, 'día', 'días'), format: Math.round};
};

const money = (value) => formatAmount(value);
const whole = (value) => String(Math.round(value));

function Cell({value, format = whole, prefix, suffix, label, bar, barTone = 'brand', tone}) {
  const spoken = [prefix, format(value), suffix].filter(Boolean).join(' ');
  return (
    <div className={styles.cell}>
      <p aria-label={spoken} className={cn(styles.value, tone && styles.tones[tone])}>
        {prefix && <span aria-hidden className={styles.affix}>{prefix}</span>}
        <span aria-hidden><CountUp value={value} format={format} /></span>
        {suffix && <span aria-hidden className={styles.affix}>{suffix}</span>}
      </p>
      <p className={styles.label}>{label}</p>
      {bar !== undefined && (
        <span aria-hidden className={styles.bar}>
          <span className={cn(styles.fill, styles.fills[barTone])} style={{width: `${bar}%`}} />
        </span>
      )}
    </div>
  );
}

function Row({title, to, linkLabel, divided, children}) {
  return (
    <div role="group" aria-label={title} className={cn(styles.row, divided && styles.divided)}>
      <div className={styles.head}>
        <h3 className={styles.headTitle}>{title}</h3>
        <Link to={to} className={styles.headLink}>{linkLabel}</Link>
      </div>
      {children}
    </div>
  );
}

function CashierRow({data}) {
  return (
    <Row title="Caja" to="/caja" linkLabel="Abrir caja">
      <Cell value={data.total} format={money} prefix="Bs" label={`vendido en ${data.cantidad} ${pluralWord(data.cantidad, 'venta', 'ventas')}`} />
      <Cell value={data.efectivo} format={money} prefix="Bs" label="en efectivo" bar={share(data.efectivo, data.total)} />
      <Cell value={data.qr} format={money} prefix="Bs" label="por QR" bar={share(data.qr, data.total)} barTone="success" />
      <Cell
        value={data.ocupadas}
        suffix={`de ${data.mesas} mesas`}
        label={`ocupadas, Bs ${formatAmount(data.porCobrar)} por cobrar`}
        bar={share(data.ocupadas, data.mesas)}
        barTone="warning"
      />
    </Row>
  );
}

function KitchenRow({data, now, divided}) {
  let wait = <Cell value={0} format={() => '—'} label="nada esperando" tone="success" />;
  if (data.waiting) {
    const minutes = waitMinutes(data.waiting.creadoEn, now);
    const parts = waitParts(minutes);
    wait = <Cell value={parts.value} format={parts.format} suffix={parts.suffix} label={`espera más larga, ${data.waiting.mesa}`} tone={waitTone(minutes)} />;
  }
  return (
    <Row title="Cocina" to="/caja" linkLabel="Abrir caja" divided={divided}>
      <Cell value={data.preparacion} label={pluralWord(data.preparacion, 'envío en preparación', 'envíos en preparación')} />
      <Cell value={data.unidadesPendientes} label="unidades por preparar" />
      <Cell value={data.listos} label={pluralWord(data.listos, 'envío listo para entregar', 'envíos listos para entregar')} />
      {wait}
    </Row>
  );
}

const ROWS = 2;

export function DaySummary({summary}) {
  return (
    <section aria-labelledby="day-summary-title" className={styles.section}>
      <div className={styles.header}>
        <h2 id="day-summary-title" className={styles.title}>Resumen de hoy</h2>
        <p className={styles.hint}>Se actualiza solo cada 30 segundos</p>
      </div>
      {summary.error && <p role="alert" className={styles.error}>No se pudo cargar el resumen: {summary.error}</p>}
      <div className={styles.board}>
        {summary.loading && Array.from({length: ROWS}, (_, index) => <div key={index} aria-label="Cargando resumen" className={cn(styles.skeleton, index > 0 && styles.divided)} />)}
        {!summary.loading && summary.cashier && <CashierRow data={summary.cashier} />}
        {!summary.loading && summary.kitchen && <KitchenRow data={summary.kitchen} now={summary.now} divided />}
      </div>
    </section>
  );
}
