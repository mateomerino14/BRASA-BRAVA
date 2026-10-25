import {motion} from 'motion/react';
import {Amount} from '../../../components/atoms/Amount';
import {cn} from '../../../lib/cn';
import {formatAmount} from '../../../lib/format';
import {productStatus} from '../utils/family';
import {ProductCover} from './ProductCover';

const styles = {
  card: 'group flex w-full flex-col overflow-hidden rounded-3xl border bg-white text-left shadow-card transition-colors focus-visible:outline-2 focus-visible:outline-brasa',
  cardIdle: 'border-arena/40 hover:border-brasa/60',
  cardSoldOut: 'border-rojo',
  cover: 'aspect-[16/7]',
  body: 'flex flex-1 items-end justify-between gap-3 p-4',
  text: 'min-w-0',
  name: 'block truncate text-base font-semibold text-carbon',
  detail: 'block truncate text-sm text-cafe',
  soldOutPrice: 'text-cafe/60 line-through',
};

const hoverLift = {y: -4};

export function ProductCard({product, onOpen}) {
  const soldOut = productStatus(product)?.key === 'agotado';
  return (
    <motion.button
      type="button"
      aria-label={`Ver ${product.nombre}`}
      onClick={() => onOpen(product)}
      whileHover={hoverLift}
      className={cn(styles.card, soldOut ? styles.cardSoldOut : styles.cardIdle)}
    >
      <ProductCover product={product} className={styles.cover} />
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
