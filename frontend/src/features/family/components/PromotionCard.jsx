import {motion} from 'motion/react';
import {Amount} from '../../../components/atoms/Amount';
import {cn} from '../../../lib/cn';
import {formatAmount} from '../../../lib/format';
import {PromotionCover} from './PromotionCover';

const styles = {
  card: 'group flex w-full flex-col overflow-hidden rounded-3xl border bg-white text-left shadow-card transition-colors focus-visible:outline-2 focus-visible:outline-brasa',
  cardIdle: 'border-arena/40 hover:border-brasa/60',
  cardOff: 'border-rojo',
  cover: 'aspect-[16/7]',
  body: 'flex flex-1 items-end justify-between gap-3 p-4',
  text: 'min-w-0',
  products: 'line-clamp-2 block text-sm text-carbon',
  saving: 'block text-xs font-semibold text-verde',
  price: 'flex shrink-0 flex-col items-end',
  regular: 'text-xs text-cafe line-through',
  offPrice: 'text-cafe/60',
};

const hoverLift = {y: -4};

const productsLine = (promotion) => promotion.productos.map((item) => `${item.cantidad} ${item.nombre}`).join(' + ');

export function PromotionCard({promotion, onOpen}) {
  const off = !promotion.disponible;
  return (
    <motion.button
      type="button"
      aria-label={`Ver ${promotion.nombre}`}
      onClick={() => onOpen(promotion)}
      whileHover={hoverLift}
      className={cn(styles.card, off ? styles.cardOff : styles.cardIdle)}
    >
      <PromotionCover promotion={promotion} className={styles.cover} />
      <span className={styles.body}>
        <span className={styles.text}>
          <span className={styles.products}>{productsLine(promotion)}</span>
          <span className={styles.saving}>Ahorra Bs {formatAmount(promotion.ahorro)}</span>
        </span>
        <span className={styles.price}>
          <span className={styles.regular}>Bs {formatAmount(promotion.precioRegular)}</span>
          <Amount prefix="Bs" value={formatAmount(promotion.precio)} valueClassName={off ? styles.offPrice : undefined} />
        </span>
      </span>
    </motion.button>
  );
}
