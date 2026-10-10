import {motion} from 'motion/react';
import {Badge} from '../../../components/atoms/Badge';
import {PriceTag} from '../../../components/molecules/PriceTag';
import {promotionWhen} from '../utils/family';
import {CoverImage} from './CoverImage';

const styles = {
  card: 'group flex w-full flex-col overflow-hidden rounded-3xl border border-mostaza/50 bg-white text-left shadow-card transition-colors hover:border-brasa/60 focus-visible:outline-2 focus-visible:outline-brasa',
  badges: 'absolute left-3 top-3 flex gap-1.5',
  body: 'flex flex-1 flex-col gap-1 p-4',
  name: 'text-base font-semibold leading-tight text-carbon',
  detail: 'text-sm text-cafe',
  price: 'mt-auto flex justify-end pt-2',
};

const hoverLift = {y: -4};

export function PromotionCard({promotion, onOpen}) {
  const when = promotionWhen(promotion);
  return (
    <motion.button type="button" aria-label={`Ver ${promotion.nombre}`} onClick={() => onOpen(promotion)} whileHover={hoverLift} className={styles.card}>
      <CoverImage src={promotion.imagenUrl} alt={promotion.nombre} muted={!promotion.disponible}>
        <span className={styles.badges}>
          <Badge tone="brand">{promotion.tipo === 'combo' ? 'Combo' : `−${promotion.valor}%`}</Badge>
          <Badge tone={when.tone}>{when.label}</Badge>
        </span>
      </CoverImage>
      <span className={styles.body}>
        <span className={styles.name}>{promotion.nombre}</span>
        <span className={styles.detail}>{promotion.productos.map((item) => `${item.cantidad}× ${item.nombre}`).join(' + ')}</span>
        <span className={styles.price}><PriceTag regular={promotion.precioRegular} promo={promotion.precio} /></span>
      </span>
    </motion.button>
  );
}
