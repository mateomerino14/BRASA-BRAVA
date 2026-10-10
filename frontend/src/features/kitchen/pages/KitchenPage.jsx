import {AnimatePresence, motion} from 'motion/react';
import {ChefHat, CircleCheckBig, Flame} from 'lucide-react';
import {Alert} from '../../../components/molecules/Alert';
import {ChipTabs} from '../../../components/molecules/ChipTabs';
import {StatCard} from '../../../components/molecules/StatCard';
import {Spinner} from '../../../components/atoms/Spinner';
import {countText} from '../../../lib/format';
import {ShipmentCard} from '../components/ShipmentCard';
import {useKitchen} from '../hooks/useKitchen';
import {PENDING_TAB, READY_TAB} from '../constants/kitchen';

const styles = {
  page: 'flex flex-col gap-6',
  summary: 'grid grid-cols-3 gap-3 sm:gap-4',
  grid: 'grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3',
  loading: 'flex justify-center py-16',
  empty: 'flex flex-col items-center gap-2 rounded-card border border-dashed border-arena bg-white px-4 py-12 text-center text-cafe',
};

const cardIn = {opacity: 0, scale: 0.96};
const cardVisible = {opacity: 1, scale: 1};

const EMPTY_TEXT = {
  [PENDING_TAB]: 'No hay pedidos en preparación. Los envíos de Caja aparecen aquí solos.',
  [READY_TAB]: 'Todavía no hay pedidos listos sin cobrar.',
};

// Pedidos pendientes de cocina: envíos de las mesas abiertas para marcar sus unidades listas
export function KitchenPage() {
  const kitchen = useKitchen();
  const {summary} = kitchen;
  const tabs = [
    {value: PENDING_TAB, label: 'En preparación', count: summary.preparacion, countLabel: countText(summary.preparacion, 'envío', 'envíos')},
    {value: READY_TAB, label: 'Listos', count: summary.listos, countLabel: countText(summary.listos, 'envío', 'envíos')},
  ];
  return (
    <div className={styles.page}>
      <section aria-label="Resumen" className={styles.summary}>
        <StatCard icon={Flame} tone="warning" label="Envíos en preparación" value={summary.preparacion} active={kitchen.tab === PENDING_TAB} onClick={() => kitchen.changeTab(PENDING_TAB)} />
        <StatCard icon={ChefHat} tone="danger" label="Unidades por preparar" value={summary.unidadesPendientes} />
        <StatCard icon={CircleCheckBig} label="Envíos listos" value={summary.listos} active={kitchen.tab === READY_TAB} onClick={() => kitchen.changeTab(READY_TAB)} />
      </section>

      <ChipTabs label="Estado de los pedidos" options={tabs} value={kitchen.tab} onChange={kitchen.changeTab} />

      {kitchen.error && <Alert tone="error">{kitchen.error}</Alert>}

      {kitchen.loading && (
        <div className={styles.loading}>
          <Spinner size={32} label="Cargando pedidos" />
        </div>
      )}

      {!kitchen.loading && kitchen.shipments.length === 0 && (
        <p className={styles.empty}>
          <ChefHat size={32} aria-hidden />
          {EMPTY_TEXT[kitchen.tab]}
        </p>
      )}

      <ul aria-label="Pedidos" className={styles.grid}>
        <AnimatePresence initial={false} mode="popLayout">
          {kitchen.shipments.map((shipment) => (
            <motion.li key={shipment.id} layout initial={cardIn} animate={cardVisible} exit={cardIn}>
              <ShipmentCard shipment={shipment} now={kitchen.now} busy={kitchen.busy} onMarkLine={kitchen.markLine} onMarkShipment={kitchen.markShipment} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
