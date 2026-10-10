import {AnimatePresence, motion} from 'motion/react';
import {CircleOff, Package, Percent, SearchX} from 'lucide-react';
import {Alert} from '../../../components/molecules/Alert';
import {ChipTabs} from '../../../components/molecules/ChipTabs';
import {FilterSelect} from '../../../components/molecules/FilterSelect';
import {SearchInput} from '../../../components/molecules/SearchInput';
import {SegmentedControl} from '../../../components/molecules/SegmentedControl';
import {StatCard} from '../../../components/molecules/StatCard';
import {Spinner} from '../../../components/atoms/Spinner';
import {FilterBar} from '../../../components/organisms/FilterBar';
import {ALL, PRODUCTS_VIEW, PROMOTIONS_VIEW} from '../constants/family';
import {useFamily} from '../hooks/useFamily';
import {DetailModal} from '../components/DetailModal';
import {ProductCard} from '../components/ProductCard';
import {PromotionCard} from '../components/PromotionCard';

const styles = {
  page: 'flex flex-col gap-6',
  summary: 'grid grid-cols-3 gap-3 sm:gap-4',
  view: 'w-full sm:max-w-sm',
  grid: 'grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4',
  loading: 'flex justify-center py-16',
  empty: 'flex flex-col items-center gap-2 rounded-card border border-dashed border-arena bg-white px-4 py-12 text-center text-cafe',
};

const VIEWS = [
  {value: PRODUCTS_VIEW, label: 'Productos', icon: Package},
  {value: PROMOTIONS_VIEW, label: 'Promociones', icon: Percent},
];

const cardIn = {opacity: 0, y: 12};
const cardVisible = {opacity: 1, y: 0};

// Familia: catálogo del local para que el personal vea qué se ofrece, a qué precio y cuánto alcanza con el stock
export function FamilyPage() {
  const family = useFamily();
  const {filters} = family;
  const available = family.allProducts.filter((item) => item.disponible && item.porciones !== 0).length;
  const withoutStock = family.allProducts.filter((item) => !item.disponible || item.porciones === 0).length;
  const today = family.allPromotions.filter((item) => item.vigencia === 'vigente').length;
  const categoryOptions = [{value: ALL, label: 'Todas'}, ...family.categories.map((item) => ({value: String(item.id), label: item.nombre}))];
  const subcategoryOptions = [{value: ALL, label: 'Todas las subcategorías'}, ...family.subcategories.map((item) => ({value: String(item.id), label: item.nombre}))];
  const isProducts = family.view === PRODUCTS_VIEW;
  let items = family.promotions;
  if (isProducts) {
    items = family.products;
  }

  return (
    <div className={styles.page}>
      <section aria-label="Resumen" className={styles.summary}>
        <StatCard icon={Package} label="Productos para vender" value={available} />
        <StatCard icon={CircleOff} tone="danger" label="Agotados o sin stock" value={withoutStock} />
        <StatCard icon={Percent} tone="warning" label="Promociones de hoy" value={today} />
      </section>

      <SegmentedControl label="Qué ver" options={VIEWS} value={family.view} onChange={family.changeView} className={styles.view} />

      <FilterBar>
        <SearchInput value={filters.search} onChange={family.changeSearch} placeholder={isProducts ? 'Buscar producto' : 'Buscar promoción o producto'} />
        {isProducts && family.subcategories.length > 0 && (
          <FilterSelect label="Filtrar por subcategoría" options={subcategoryOptions} value={filters.subcategoria} onChange={family.changeSubcategory} />
        )}
      </FilterBar>
      {isProducts && <ChipTabs label="Categorías" options={categoryOptions} value={filters.categoria} onChange={family.changeCategory} />}

      {family.error && <Alert tone="error">{family.error}</Alert>}
      {family.loading && <div className={styles.loading}><Spinner size={32} label="Cargando catálogo" /></div>}

      {!family.loading && items.length === 0 && (
        <p className={styles.empty}>
          <SearchX size={32} aria-hidden />
          {isProducts ? 'No hay productos que coincidan con los filtros.' : 'No hay promociones activas que coincidan.'}
        </p>
      )}

      <ul aria-label={isProducts ? 'Productos' : 'Promociones'} className={styles.grid}>
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((item) => (
            <motion.li key={`${family.view}-${item.id}`} layout initial={cardIn} animate={cardVisible} exit={cardIn}>
              {isProducts ? <ProductCard product={item} onOpen={family.openProduct} /> : <PromotionCard promotion={item} onOpen={family.openPromotion} />}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <DetailModal detail={family.detail} onClose={family.closeDetail} />
    </div>
  );
}
