import {motion} from 'motion/react';
import {Ban, TriangleAlert} from 'lucide-react';
import {Amount} from '../../../components/atoms/Amount';
import {cn} from '../../../lib/cn';
import {formatAmount} from '../../../lib/format';
import {resolveAssetUrl} from '../../../lib/apiClient';
import {productStatus} from '../utils/family';

const styles = {
  card: 'group flex w-full flex-col overflow-hidden rounded-3xl border bg-white text-left shadow-card transition-colors focus-visible:outline-2 focus-visible:outline-brasa',
  cardIdle: 'border-arena/40 hover:border-brasa/60',
  cardSoldOut: 'border-rojo',
  cover: 'relative aspect-[16/7] w-full overflow-hidden bg-carbon',
  image: 'absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105',
  plain: 'absolute inset-0 bg-grill p-4',
  plainLabel: 'relative font-display text-2xl leading-none tracking-wide text-mostaza',
  plainInitials: 'pointer-events-none absolute -right-2 -top-5 font-display text-[110px] leading-none text-white/[0.06]',
  muted: 'grayscale opacity-70',
  band: 'absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-4 py-1.5 text-xs font-bold uppercase tracking-wider',
  bandLabel: 'flex items-center gap-1.5',
  bandHint: 'truncate font-semibold normal-case tracking-normal opacity-90',
  body: 'flex flex-1 items-end justify-between gap-3 p-4',
  text: 'min-w-0',
  name: 'block truncate text-base font-semibold text-carbon',
  detail: 'block truncate text-sm text-cafe',
  soldOutPrice: 'text-cafe/60 line-through',
};

// Color de la banda y texto de ayuda de cada estado
const BANDS = {
  agotado: {className: 'bg-rojo text-white', hint: 'No se vende hoy', icon: Ban},
  sinStock: {className: 'bg-carbon text-crema', hint: 'Falta un insumo', icon: TriangleAlert},
  pocas: {className: 'bg-mostaza text-carbon', hint: 'Avise a cocina', icon: TriangleAlert},
};

const hoverLift = {y: -4};

// Hasta dos iniciales del nombre para la portada sin foto
const initials = (text) => text.split(/\s+/).filter((word) => word.length > 2).slice(0, 2).map((word) => word[0]).join('').toUpperCase();

function Cover({product, muted}) {
  if (product.imagenUrl) {
    return <img src={resolveAssetUrl(product.imagenUrl)} alt={product.nombre} className={cn(styles.image, muted && styles.muted)} />;
  }
  return (
    <span role="img" aria-label={`${product.nombre} (sin imagen)`} className={cn(styles.plain, muted && styles.muted)}>
      <span aria-hidden className={styles.plainInitials}>{initials(product.nombre)}</span>
      <span aria-hidden className={styles.plainLabel}>{product.subcategoria}</span>
    </span>
  );
}

// Tarjeta de Familia: portada corta (foto o subcategoría sobre carbón) con una banda de color si el producto tiene un aviso
export function ProductCard({product, onOpen}) {
  const status = productStatus(product);
  const soldOut = status?.key === 'agotado';
  const band = status && BANDS[status.key];
  const BandIcon = band?.icon;

  return (
    <motion.button
      type="button"
      aria-label={`Ver ${product.nombre}`}
      onClick={() => onOpen(product)}
      whileHover={hoverLift}
      className={cn(styles.card, soldOut ? styles.cardSoldOut : styles.cardIdle)}
    >
      <span className={styles.cover}>
        <Cover product={product} muted={soldOut} />
        {band && (
          <span className={cn(styles.band, band.className)}>
            <span className={styles.bandLabel}><BandIcon size={13} aria-hidden />{status.label}</span>
            <span className={styles.bandHint}>{band.hint}</span>
          </span>
        )}
      </span>
      <span className={styles.body}>
        <span className={styles.text}>
          <span className={styles.name}>{product.nombre}</span>
          {product.descripcion && <span className={styles.detail}>{product.descripcion}</span>}
        </span>
        <Amount prefix="Bs" value={formatAmount(product.precio)} valueClassName={soldOut ? styles.soldOutPrice : undefined} />
      </span>
    </motion.button>
  );
}
