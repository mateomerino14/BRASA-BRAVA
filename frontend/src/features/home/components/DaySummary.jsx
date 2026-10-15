import {Link} from 'react-router';
import {motion} from 'motion/react';
import {ArrowRight, Banknote, CheckCheck, ChefHat, Flame, QrCode, Receipt, Timer, Utensils} from 'lucide-react';
import {StatCard} from '../../../components/molecules/StatCard';
import {Amount} from '../../../components/atoms/Amount';
import {formatAmount} from '../../../lib/format';
import {waitMinutes, waitTone} from '../../kitchen/utils/kitchen';

const styles = {
  section: 'flex flex-col gap-5',
  header: 'flex flex-wrap items-end justify-between gap-2',
  title: 'font-display text-3xl text-carbon',
  hint: 'text-sm text-cafe',
  group: 'flex flex-col gap-3',
  groupHeader: 'flex items-center justify-between gap-3',
  groupTitle: 'font-display text-xl text-cafe',
  link: 'inline-flex items-center gap-1 text-sm font-semibold text-brasa-oscuro underline-offset-4 hover:underline',
  grid: 'grid grid-cols-2 gap-3 lg:grid-cols-4',
  skeleton: 'h-[84px] animate-pulse rounded-card bg-hueso',
  error: 'text-sm font-medium text-error',
};

const pluralWord = (count, one, many) => {
  if (count === 1) {
    return one;
  }
  return many;
};

const plural = (count, one, many) => `${count} ${pluralWord(count, one, many)}`;

const reveal = {hidden: {opacity: 0, y: 12}, visible: {opacity: 1, y: 0}};
const stagger = {visible: {transition: {staggerChildren: 0.08}}};
const SKELETON_CARDS = 4;
const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 1440;
const bigValue = 'text-3xl sm:text-4xl';

const waitParts = (minutes) => {
  if (minutes < MINUTES_PER_HOUR) {
    return {value: String(minutes), suffix: 'min'};
  }
  if (minutes < MINUTES_PER_DAY) {
    const rest = String(minutes % MINUTES_PER_HOUR).padStart(2, '0');
    return {value: `${Math.floor(minutes / MINUTES_PER_HOUR)}:${rest}`, suffix: 'h'};
  }
  const days = Math.floor(minutes / MINUTES_PER_DAY);
  return {value: String(days), suffix: pluralWord(days, 'día', 'días')};
};

function Money({value}) {
  return <Amount prefix="Bs" value={formatAmount(value)} valueClassName={bigValue} />;
}

function Group({title, to, linkLabel, children}) {
  return (
    <motion.div variants={reveal} className={styles.group}>
      <div className={styles.groupHeader}>
        <h3 className={styles.groupTitle}>{title}</h3>
        <Link to={to} className={styles.link}>
          {linkLabel}
          <ArrowRight size={15} aria-hidden />
        </Link>
      </div>
      <div className={styles.grid}>{children}</div>
    </motion.div>
  );
}

function CashierGroup({data}) {
  return (
    <Group title="Caja" to="/caja" linkLabel="Ir a Caja">
      <StatCard icon={Receipt} value={<Money value={data.total} />} label={`Vendido hoy · ${plural(data.cantidad, 'venta', 'ventas')}`} />
      <StatCard icon={Banknote} tone="success" value={<Money value={data.efectivo} />} label="Cobrado en efectivo" />
      <StatCard icon={QrCode} tone="success" value={<Money value={data.qr} />} label="Cobrado por QR" />
      <StatCard
        icon={Utensils}
        tone="warning"
        value={<Amount value={String(data.ocupadas)} suffix={`de ${data.mesas}`} valueClassName={bigValue} />}
        label={`Mesas ocupadas · Bs ${formatAmount(data.porCobrar)} por cobrar`}
      />
    </Group>
  );
}

function KitchenGroup({data, now}) {
  let waitValue = '—';
  let waitLabel = 'Nada esperando';
  let waitColor = 'success';
  if (data.waiting) {
    const minutes = waitMinutes(data.waiting.creadoEn, now);
    const parts = waitParts(minutes);
    waitValue = <Amount value={parts.value} suffix={parts.suffix} valueClassName={bigValue} />;
    waitLabel = `Espera más larga · ${data.waiting.mesa}`;
    waitColor = waitTone(minutes);
  }
  return (
    <Group title="Cocina" to="/cocina" linkLabel="Ir a Cocina">
      <StatCard icon={Flame} value={data.preparacion} label="Envíos en preparación" />
      <StatCard icon={ChefHat} tone="warning" value={data.unidadesPendientes} label="Unidades por preparar" />
      <StatCard icon={CheckCheck} tone="success" value={data.listos} label="Envíos listos para entregar" />
      <StatCard icon={Timer} tone={waitColor} value={waitValue} label={waitLabel} />
    </Group>
  );
}

export function DaySummary({summary, showCashier, showKitchen}) {
  const groups = [showCashier, showKitchen].filter(Boolean).length;
  return (
    <section aria-labelledby="day-summary-title" className={styles.section}>
      <div className={styles.header}>
        <h2 id="day-summary-title" className={styles.title}>Resumen de hoy</h2>
        <p className={styles.hint}>Se actualiza solo cada 30 segundos</p>
      </div>
      {summary.error && <p role="alert" className={styles.error}>No se pudo cargar el resumen: {summary.error}</p>}
      {summary.loading && (
        <div className={styles.grid} aria-label="Cargando resumen">
          {Array.from({length: SKELETON_CARDS * groups}, (_, index) => <div key={index} className={styles.skeleton} />)}
        </div>
      )}
      {!summary.loading && (
        <motion.div initial="hidden" animate="visible" variants={stagger} className={styles.section}>
          {showCashier && summary.cashier && <CashierGroup data={summary.cashier} />}
          {showKitchen && summary.kitchen && <KitchenGroup data={summary.kitchen} now={summary.now} />}
        </motion.div>
      )}
    </section>
  );
}
