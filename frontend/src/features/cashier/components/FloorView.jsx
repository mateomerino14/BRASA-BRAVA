import {Armchair, HandCoins, ReceiptText, UtensilsCrossed} from 'lucide-react';
import {Button} from '../../../components/atoms/Button';
import {TodaySalesModal} from './TodaySalesModal';
import {AnimatePresence, motion} from 'motion/react';
import {Alert} from '../../../components/molecules/Alert';
import {ChipTabs} from '../../../components/molecules/ChipTabs';
import {StatCard} from '../../../components/molecules/StatCard';
import {Spinner} from '../../../components/atoms/Spinner';
import {formatAmount} from '../../../lib/format';
import {TableCard} from './TableCard';

const styles = {
  page: 'flex flex-col gap-6',
  summary: 'grid grid-cols-3 gap-3 sm:gap-4',
  toolbar: 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
  tabs: 'min-w-0 flex-1',
  grid: 'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 2xl:grid-cols-5',
  loading: 'flex justify-center py-16',
  empty: 'rounded-card border border-dashed border-arena bg-white px-4 py-10 text-center text-sm text-cafe',
};

const cardIn = {opacity: 0, scale: 0.95};
const cardVisible = {opacity: 1, scale: 1};

// Cada sección muestra cuántas mesas tiene ocupadas (solo si hay alguna)
const sectionOptions = (sections) => sections.map((section) => {
  const busy = section.mesas.filter((table) => table.venta).length;
  const option = {value: String(section.id), label: section.nombre};
  if (busy === 1) {
    option.count = busy;
    option.countLabel = '1 mesa ocupada';
  }
  if (busy > 1) {
    option.count = busy;
    option.countLabel = `${busy} mesas ocupadas`;
  }
  return option;
});

export function FloorView({floor, sales, canEditLink, onOpenTable}) {
  const {summary, section} = floor;
  return (
    <div className={styles.page}>
      <section aria-label="Resumen" className={styles.summary}>
        <StatCard icon={Armchair} label="Mesas libres" value={summary.libres} />
        <StatCard icon={UtensilsCrossed} tone="danger" label="Mesas ocupadas" value={summary.ocupadas} />
        <StatCard icon={HandCoins} tone="warning" label="Bs por cobrar" value={formatAmount(summary.porCobrar)} />
      </section>

      {floor.error && <Alert tone="error">{floor.error}</Alert>}

      {floor.loading && (
        <div className={styles.loading}>
          <Spinner size={32} label="Cargando mesas" />
        </div>
      )}

      {!floor.loading && !section && !floor.error && (
        <p className={styles.empty}>No hay secciones activas. Créelas en Administración, Secciones.</p>
      )}

      {section && (
        <>
          <div className={styles.toolbar}>
            <ChipTabs label="Secciones" options={sectionOptions(floor.sections)} value={String(section.id)} onChange={floor.selectSection} className={styles.tabs} />
            <Button variant="outline" size="sm" icon={<ReceiptText size={16} aria-hidden />} onClick={sales.show}>Ventas de hoy</Button>
          </div>
          <ul aria-label={`Mesas de ${section.nombre}`} className={styles.grid}>
            <AnimatePresence initial={false} mode="popLayout">
              {section.mesas.map((mesa) => (
                <motion.li key={mesa.id} layout initial={cardIn} animate={cardVisible} exit={cardIn}>
                  <TableCard mesa={mesa} now={floor.now} onSelect={onOpenTable} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </>
      )}

      <TodaySalesModal sales={sales} canEditLink={canEditLink} />
    </div>
  );
}
