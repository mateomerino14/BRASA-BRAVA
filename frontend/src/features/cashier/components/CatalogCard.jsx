import {motion} from 'motion/react';
import {Amount} from '../../../components/atoms/Amount';
import {Badge} from '../../../components/atoms/Badge';
import {Thumbnail} from '../../../components/atoms/Thumbnail';
import {PriceTag} from '../../../components/molecules/PriceTag';
import {cn} from '../../../lib/cn';
import {formatAmount} from '../../../lib/format';

const styles = {
  card: 'flex w-full min-w-0 items-center gap-3 rounded-card border bg-white p-3 text-left shadow-card transition-colors focus-visible:outline-2 focus-visible:outline-brasa disabled:cursor-not-allowed disabled:opacity-60',
  idle: 'border-arena/40 hover:border-brasa/70',
  promo: 'border-mostaza/60 bg-mostaza/5 hover:border-brasa/70',
  body: 'flex min-w-0 flex-1 flex-col gap-1',
  name: 'text-sm font-semibold leading-tight text-carbon',
  detail: 'line-clamp-1 text-xs text-cafe',
  bottom: 'mt-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-1',
  badges: 'flex flex-wrap gap-1',
};

const LOW_PORTIONS = 5;

const hoverLift = {y: -2};
const tapPress = {scale: 0.98};

const productBadge = (product) => {
  if (!product.disponible) {
    return <Badge tone="neutral">No disponible</Badge>;
  }
  if (product.porciones === 0) {
    return <Badge tone="danger">Sin stock</Badge>;
  }
  if (product.porciones !== null && product.porciones <= LOW_PORTIONS) {
    return <Badge tone="warning">Quedan {product.porciones}</Badge>;
  }
  return null;
};

const comboDetail = (promotion) => promotion.productos.map((item) => `${item.cantidad}× ${item.nombre}`).join(' + ');

export function CatalogCard({kind, item, onPick}) {
  const isPromo = kind === 'promocion';
  const disabled = !isPromo && !item.disponible;
  let detail = item.descripcion;
  let badge = productBadge(item);
  let price = <Amount prefix="Bs" value={formatAmount(item.precio)} />;
  let label = `${item.nombre}, Bs ${formatAmount(item.precio)}`;
  if (isPromo) {
    detail = comboDetail(item);
    badge = <Badge tone="brand">{item.tipo === 'combo' ? 'Combo' : `−${item.valor}%`}</Badge>;
    price = <PriceTag regular={item.precioRegular} promo={item.precio} />;
    label = `${item.nombre}, promoción, Bs ${formatAmount(item.precio)}`;
  }
  if (disabled) {
    label = `${item.nombre}, no disponible`;
  }
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={() => onPick(kind, item)}
      disabled={disabled}
      whileHover={disabled ? undefined : hoverLift}
      whileTap={disabled ? undefined : tapPress}
      className={cn(styles.card, isPromo ? styles.promo : styles.idle)}
    >
      <Thumbnail src={item.imagenUrl} alt={item.nombre} size={56} muted={disabled} />
      <span className={styles.body}>
        <span className={styles.name}>{item.nombre}</span>
        {detail && <span className={styles.detail}>{detail}</span>}
        <span className={styles.bottom}>
          <span className={styles.badges}>{badge}</span>
          {price}
        </span>
      </span>
    </motion.button>
  );
}
