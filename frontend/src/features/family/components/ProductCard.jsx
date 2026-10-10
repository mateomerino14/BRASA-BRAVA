import {motion} from 'motion/react';
import {Amount} from '../../../components/atoms/Amount';
import {Badge} from '../../../components/atoms/Badge';
import {formatAmount} from '../../../lib/format';
import {productStatus} from '../utils/family';
import {CoverImage} from './CoverImage';

const styles = {
  card: 'group flex w-full flex-col overflow-hidden rounded-3xl border border-arena/40 bg-white text-left shadow-card transition-colors hover:border-brasa/60 focus-visible:outline-2 focus-visible:outline-brasa',
  badge: 'absolute left-3 top-3',
  body: 'flex flex-1 flex-col gap-1 p-4',
  sub: 'text-xs font-semibold uppercase tracking-wide text-cafe',
  name: 'text-base font-semibold leading-tight text-carbon',
  detail: 'line-clamp-2 text-sm text-cafe',
  price: 'mt-auto pt-2',
};

const hoverLift = {y: -4};

export function ProductCard({product, onOpen}) {
  const status = productStatus(product);
  return (
    <motion.button type="button" aria-label={`Ver ${product.nombre}`} onClick={() => onOpen(product)} whileHover={hoverLift} className={styles.card}>
      <CoverImage src={product.imagenUrl} alt={product.nombre} muted={!product.disponible}>
        {status && <Badge tone={status.tone} className={styles.badge}>{status.label}</Badge>}
      </CoverImage>
      <span className={styles.body}>
        <span className={styles.sub}>{product.subcategoria}</span>
        <span className={styles.name}>{product.nombre}</span>
        {product.descripcion && <span className={styles.detail}>{product.descripcion}</span>}
        <span className={styles.price}><Amount prefix="Bs" value={formatAmount(product.precio)} /></span>
      </span>
    </motion.button>
  );
}
