import {RotateCw} from 'lucide-react';
import {Modal} from '../../../components/organisms/Modal';
import {Button} from '../../../components/atoms/Button';
import {Amount} from '../../../components/atoms/Amount';
import {Spinner} from '../../../components/atoms/Spinner';
import {cn} from '../../../lib/cn';
import {countText, formatAmount, formatDate, formatQuantity} from '../../../lib/format';
import {LOW_PORTIONS} from '../constants/family';
import {ProductCover} from './ProductCover';
import {PromotionCover} from './PromotionCover';

const styles = {
  body: 'flex flex-col gap-5',
  cover: 'rounded-card',
  head: 'flex items-start justify-between gap-4',
  headText: 'flex min-w-0 flex-col gap-1',
  kind: 'text-xs font-semibold uppercase tracking-wider text-cafe',
  detailCover: 'h-32 sm:h-36',
  recipe: 'flex flex-col divide-y divide-arena/50 text-[15px] text-carbon',
  recipeRow: 'flex items-baseline justify-between gap-4 py-2.5',
  reach: 'whitespace-nowrap text-sm text-cafe',
  reachNone: 'font-semibold text-rojo',
  reachLow: 'text-brasa-oscuro',
  promotionCover: 'h-36 sm:h-40',
  soldOutMark: 'font-semibold text-rojo',
  total: 'flex justify-between gap-4 border-t border-carbon/70 pt-2.5 text-sm text-cafe',
  struck: 'line-through',
  saving: 'text-verde',
  tags: 'flex flex-wrap gap-1.5',
  sectionTitle: 'mb-1 text-xs font-semibold uppercase tracking-wider text-cafe',
  text: 'text-base text-carbon',
  portions: 'flex items-center gap-3 rounded-card px-4 py-3 text-sm font-semibold',
  portionTones: {muted: 'text-sm text-cafe', low: 'text-sm font-semibold text-brasa-oscuro', none: 'text-sm font-semibold text-rojo'},
  table: 'w-full text-left text-sm',
  th: 'pb-2 text-xs font-bold uppercase tracking-wide text-cafe',
  td: 'border-t border-arena/40 py-2.5 align-middle',
  num: 'whitespace-nowrap pl-3 text-right tabular-nums',
  rows: 'flex flex-col divide-y divide-arena/40 rounded-card border border-arena/50 bg-white',
  row: 'flex items-center justify-between gap-3 px-3 py-2.5 text-sm',
  loading: 'flex justify-center py-8',
  failed: 'flex flex-wrap items-center justify-between gap-3 rounded-card border border-dashed border-arena bg-white px-4 py-3 text-sm text-cafe',
};

// Frase con lo que alcanza el stock de hoy; "missing" son los insumos que no hay
const portionsMessage = (product, missing) => {
  if (!product.disponible) {
    return {tone: 'none', text: 'Está marcado como agotado: hoy no se vende en Caja.'};
  }
  if (product.porciones === null) {
    return {tone: 'muted', text: 'Todavía no tiene receta cargada, así que no se calcula cuánto alcanza.'};
  }
  if (product.porciones === 0) {
    let lack = '';
    if (missing.length > 0) {
      lack = `: falta ${missing.join(', ')}`;
    }
    return {tone: 'none', text: `Hoy no alcanza para ninguna porción${lack}. Se puede vender igual, pero avise a cocina.`};
  }
  if (product.porciones <= LOW_PORTIONS) {
    return {tone: 'low', text: `Quedan ${countText(product.porciones, 'porción', 'porciones')}. Avise a cocina.`};
  }
  return {tone: 'muted', text: `Con el stock de hoy alcanza para ${countText(product.porciones, 'porción', 'porciones')}.`};
};

// Lo que alcanza un insumo, dicho corto: "no hay", "de baja" o "para 36"
const reachText = (item) => {
  if (!item.activo) {
    return 'de baja';
  }
  if (item.alcanza === 0) {
    return 'no hay';
  }
  return `para ${item.alcanza}`;
};

const sortedRecipe = (recipe) => [...recipe].sort((a, b) => a.alcanza - b.alcanza);

// Portada del detalle: si falta algún insumo la banda dice cuál
export function ProductDetailCover({product}) {
  const missing = (product.receta ?? []).filter((item) => item.alcanza === 0).map((item) => item.nombre.toLowerCase());
  let hint;
  if (product.disponible && product.porciones === 0 && missing.length > 0) {
    hint = `Falta ${missing.join(', ')}`;
  }
  return <ProductCover product={product} hint={hint} className={styles.detailCover} />;
}

function ProductDetail({product, loading, failed, onRetry}) {
  const recipe = product.receta ?? [];
  const missing = recipe.filter((item) => item.alcanza === 0).map((item) => item.nombre.toLowerCase());
  const portions = portionsMessage(product, missing);
  return (
    <div className={styles.body}>
      <div className={styles.head}>
        <span className={styles.headText}>
          <span className={styles.kind}>{product.categoria} · {product.subcategoria}</span>
          {product.descripcion && <span className={styles.text}>{product.descripcion}</span>}
        </span>
        <Amount prefix="Bs" size="lg" value={formatAmount(product.precio)} />
      </div>
      <p className={styles.portionTones[portions.tone]}>{portions.text}</p>
      {loading && <div className={styles.loading}><Spinner size={24} label="Cargando receta" /></div>}
      {failed && (
        <div className={styles.failed}>
          <span>No se pudo cargar la receta</span>
          <Button size="sm" variant="outline" icon={<RotateCw size={16} aria-hidden />} onClick={onRetry}>
            Reintentar
          </Button>
        </div>
      )}
      {recipe.length > 0 && (
        <section aria-label="Receta">
          <p className={styles.sectionTitle}>Lleva por porción</p>
          <ul className={styles.recipe}>
            {sortedRecipe(recipe).map((item) => (
              <li key={item.id} className={styles.recipeRow}>
                <span>{formatQuantity(item.cantidad, item.unidad)} de {item.nombre.toLowerCase()}</span>
                <span className={cn(styles.reach, (item.alcanza === 0 || !item.activo) && styles.reachNone, item.nivel === 'bajo' && styles.reachLow)}>{reachText(item)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const PLURAL_DAY = {sábado: 'sábados', domingo: 'domingos'};

// Los días en una frase: "todos los días", "de lunes a viernes", "los martes", "los martes y jueves"
const daysPhrase = (days) => {
  const selected = WEEK_ORDER.filter((index) => days[index] === '1').map((index) => DAY_NAMES[index]);
  if (selected.length === WEEK_ORDER.length) {
    return 'todos los días';
  }
  if (days === '0111110') {
    return 'de lunes a viernes';
  }
  if (days === '1000001') {
    return 'los fines de semana';
  }
  const names = selected.map((name) => PLURAL_DAY[name] ?? name);
  if (names.length === 1) {
    return `los ${names[0]}`;
  }
  return `los ${names.slice(0, -1).join(', ')} y ${names.at(-1)}`;
};

// Cuándo se vende, dicho en una frase: "Se vende de lunes a viernes, del 3 oct al 9 nov."
const whenText = (promotion) => {
  let dates = `desde el ${formatDate(promotion.fechaInicio)}`;
  if (promotion.fechaFin) {
    dates = `del ${formatDate(promotion.fechaInicio)} al ${formatDate(promotion.fechaFin)}`;
  }
  let hours = '';
  if (promotion.horaInicio && promotion.horaFin) {
    hours = ` de ${promotion.horaInicio} a ${promotion.horaFin}`;
  }
  return `Se vende ${daysPhrase(promotion.dias)}${hours}, ${dates}.`;
};

function PromotionDetail({promotion}) {
  const soldOut = new Set(promotion.agotados ?? []);
  return (
    <div className={styles.body}>
      <div className={styles.head}>
        <span className={styles.headText}>
          <span className={styles.text}>{whenText(promotion)}</span>
          {promotion.descripcion && <span className={styles.text}>{promotion.descripcion}</span>}
        </span>
        <Amount prefix="Bs" size="lg" value={formatAmount(promotion.precio)} />
      </div>
      <section aria-label="Productos de la promoción">
        <p className={styles.sectionTitle}>Incluye</p>
        <ul className={styles.recipe}>
          {promotion.productos.map((item) => (
            <li key={item.id} className={styles.recipeRow}>
              <span>
                {item.cantidad} {item.nombre.toLowerCase()}
                {soldOut.has(item.nombre.toLowerCase()) && <strong className={styles.soldOutMark}> · agotado</strong>}
              </span>
              <span className={styles.reach}>Bs {formatAmount(item.precio * item.cantidad)}</span>
            </li>
          ))}
        </ul>
        <p className={styles.total}>
          <span>Por separado <span className={styles.struck}>Bs {formatAmount(promotion.precioRegular)}</span></span>
          <strong className={styles.saving}>Ahorra Bs {formatAmount(promotion.ahorro)}</strong>
        </p>
      </section>
    </div>
  );
}

function DetailCover({kind, item}) {
  if (kind === 'promocion') {
    return <PromotionCover promotion={item} size="lg" className={styles.promotionCover} />;
  }
  return <ProductDetailCover product={item} />;
}

export function DetailModal({detail, onClose, onRetry}) {
  const {item} = detail;
  return (
    <Modal
      open={detail.open}
      onClose={onClose}
      title={item?.nombre ?? ''}
      size="md"
      hideTitle={detail.kind === 'promocion'}
      cover={item && <DetailCover kind={detail.kind} item={item} />}
    >
      {item && detail.kind === 'producto' && <ProductDetail product={item} loading={detail.loading} failed={detail.failed} onRetry={onRetry} />}
      {item && detail.kind === 'promocion' && <PromotionDetail promotion={item} />}
    </Modal>
  );
}
