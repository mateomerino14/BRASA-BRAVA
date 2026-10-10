import {AnimatePresence, motion} from 'motion/react';
import {SearchX} from 'lucide-react';
import {ChipTabs} from '../../../components/molecules/ChipTabs';
import {SearchInput} from '../../../components/molecules/SearchInput';
import {ALL_CATEGORIES, PROMOTIONS_CATEGORY} from '../constants/cashier';
import {CatalogCard} from './CatalogCard';

const styles = {
  panel: 'flex min-w-0 flex-col gap-4',
  search: 'flex-none',
  grid: 'grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3',
  empty: 'flex flex-col items-center gap-2 rounded-card border border-dashed border-arena bg-white px-4 py-10 text-center text-sm text-cafe',
};

const cardIn = {opacity: 0, y: 8};
const cardVisible = {opacity: 1, y: 0};

const categoryOptions = (catalog) => {
  const options = [{value: ALL_CATEGORIES, label: 'Todo'}];
  const total = catalog.promociones.length;
  if (total > 0) {
    let countLabel = `${total} vigentes`;
    if (total === 1) {
      countLabel = '1 vigente';
    }
    options.push({value: PROMOTIONS_CATEGORY, label: 'Promociones de hoy', count: total, countLabel});
  }
  for (const category of catalog.categorias) {
    options.push({value: String(category.id), label: category.nombre});
  }
  return options;
};

export function CatalogPanel({order}) {
  return (
    <section aria-label="Menú" className={styles.panel}>
      <SearchInput value={order.search} onChange={order.changeSearch} placeholder="Buscar producto o promoción" className={styles.search} />
      <ChipTabs label="Categorías del menú" options={categoryOptions(order.catalog)} value={order.category} onChange={order.changeCategory} />
      {order.visibleItems.length === 0 ? (
        <p className={styles.empty}>
          <SearchX size={28} aria-hidden />
          No hay productos que coincidan con la búsqueda.
        </p>
      ) : (
        <ul className={styles.grid}>
          <AnimatePresence initial={false}>
            {order.visibleItems.map(({kind, item}) => (
              <motion.li key={`${kind}-${item.id}`} layout initial={cardIn} animate={cardVisible} exit={cardIn}>
                <CatalogCard kind={kind} item={item} onPick={order.openPicker} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}
