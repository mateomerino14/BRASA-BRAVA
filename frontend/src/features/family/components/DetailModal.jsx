import {CircleAlert} from 'lucide-react';
import {Modal} from '../../../components/organisms/Modal';
import {Alert} from '../../../components/molecules/Alert';
import {PriceTag} from '../../../components/molecules/PriceTag';
import {Amount} from '../../../components/atoms/Amount';
import {Badge} from '../../../components/atoms/Badge';
import {Spinner} from '../../../components/atoms/Spinner';
import {cn} from '../../../lib/cn';
import {countText, formatAmount, formatDate, formatDays, formatQuantity} from '../../../lib/format';
import {LEVEL_LABELS, LEVEL_TONES, LOW_PORTIONS} from '../constants/family';
import {productStatus, promotionWhen} from '../utils/family';
import {CoverImage} from './CoverImage';

const styles = {
  body: 'flex flex-col gap-5',
  cover: 'rounded-card',
  head: 'flex flex-wrap items-center justify-between gap-3',
  tags: 'flex flex-wrap gap-1.5',
  sectionTitle: 'text-xs font-bold uppercase tracking-wide text-cafe',
  text: 'text-base text-carbon',
  portions: 'flex items-center gap-3 rounded-card px-4 py-3 text-sm font-semibold',
  portionTones: {ok: 'bg-verde/10 text-verde', low: 'bg-mostaza/15 text-cafe', none: 'bg-rojo/10 text-rojo', unknown: 'bg-hueso text-cafe'},
  table: 'w-full text-left text-sm',
  th: 'pb-2 text-xs font-bold uppercase tracking-wide text-cafe',
  td: 'border-t border-arena/40 py-2.5 align-middle',
  num: 'whitespace-nowrap pl-3 text-right tabular-nums',
  rows: 'flex flex-col divide-y divide-arena/40 rounded-card border border-arena/50 bg-white',
  row: 'flex items-center justify-between gap-3 px-3 py-2.5 text-sm',
  loading: 'flex justify-center py-8',
};

const portionsMessage = (product) => {
  if (product.porciones === null) {
    return {tone: 'unknown', text: 'Sin receta cargada: no se puede calcular cuántas porciones alcanzan.'};
  }
  if (product.porciones === 0) {
    return {tone: 'none', text: 'No alcanza para ninguna porción con el stock actual. Se puede vender igual, pero avise a cocina.'};
  }
  if (product.porciones <= LOW_PORTIONS) {
    return {tone: 'low', text: `Alcanza para ${countText(product.porciones, 'porción', 'porciones')}.`};
  }
  return {tone: 'ok', text: `Alcanza para ${countText(product.porciones, 'porción', 'porciones')}.`};
};

function ProductDetail({product, loading}) {
  const status = productStatus(product);
  const portions = portionsMessage(product);
  return (
    <div className={styles.body}>
      {product.imagenUrl && <CoverImage src={product.imagenUrl} alt={product.nombre} muted={!product.disponible} className={styles.cover} />}
      <div className={styles.head}>
        <span className={styles.tags}>
          <Badge tone="neutral">{product.categoria} · {product.subcategoria}</Badge>
          {status && <Badge tone={status.tone}>{status.label}</Badge>}
        </span>
        <Amount prefix="Bs" size="lg" value={formatAmount(product.precio)} />
      </div>
      {product.descripcion && <p className={styles.text}>{product.descripcion}</p>}
      <p className={cn(styles.portions, styles.portionTones[portions.tone])}>
        <CircleAlert size={18} aria-hidden />
        {portions.text}
      </p>
      {loading && <div className={styles.loading}><Spinner size={24} label="Cargando receta" /></div>}
      {product.receta?.length > 0 && (
        <section aria-label="Receta">
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Insumo</th>
                <th className={cn(styles.th, styles.num)}>Por porción</th>
                <th className={cn(styles.th, styles.num)}>En stock</th>
                <th className={cn(styles.th, styles.num)}>Alcanza</th>
              </tr>
            </thead>
            <tbody>
              {product.receta.map((item) => (
                <tr key={item.id}>
                  <td className={styles.td}>
                    <span className={styles.tags}>
                      {item.nombre}
                      <Badge tone={LEVEL_TONES[item.nivel]}>{item.activo ? LEVEL_LABELS[item.nivel] : 'De baja'}</Badge>
                    </span>
                  </td>
                  <td className={cn(styles.td, styles.num)}>{formatQuantity(item.cantidad, item.unidad)}</td>
                  <td className={cn(styles.td, styles.num)}>{formatQuantity(item.stock, item.unidad)}</td>
                  <td className={cn(styles.td, styles.num)}>{item.alcanza}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function PromotionDetail({promotion}) {
  const when = promotionWhen(promotion);
  let dates = `Desde ${formatDate(promotion.fechaInicio)}`;
  if (promotion.fechaFin) {
    dates = `Del ${formatDate(promotion.fechaInicio)} al ${formatDate(promotion.fechaFin)}`;
  }
  return (
    <div className={styles.body}>
      {promotion.imagenUrl && <CoverImage src={promotion.imagenUrl} alt={promotion.nombre} className={styles.cover} />}
      <div className={styles.head}>
        <span className={styles.tags}>
          <Badge tone="brand">{promotion.tipo === 'combo' ? 'Combo' : `Descuento ${promotion.valor}%`}</Badge>
          <Badge tone={when.tone}>{when.label}</Badge>
        </span>
        <PriceTag regular={promotion.precioRegular} promo={promotion.precio} size="lg" />
      </div>
      {promotion.descripcion && <p className={styles.text}>{promotion.descripcion}</p>}
      {!promotion.disponible && <Alert tone="info">Tiene productos agotados: hoy no se puede vender en Caja.</Alert>}
      <section aria-label="Productos de la promoción" className={styles.rows}>
        {promotion.productos.map((item) => (
          <p key={item.id} className={styles.row}>
            <span>{item.cantidad}× {item.nombre}</span>
            <span>Bs {formatAmount(item.precio * item.cantidad)}</span>
          </p>
        ))}
      </section>
      <section aria-label="Cuándo aplica" className={styles.rows}>
        <p className={styles.row}><span>Días</span><strong>{formatDays(promotion.dias)}</strong></p>
        <p className={styles.row}><span>Fechas</span><strong>{dates}</strong></p>
      </section>
    </div>
  );
}

export function DetailModal({detail, onClose}) {
  const {item} = detail;
  return (
    <Modal open={detail.open} onClose={onClose} title={item?.nombre ?? ''} size="md">
      {detail.error && <Alert tone="error">{detail.error}</Alert>}
      {item && detail.kind === 'producto' && <ProductDetail product={item} loading={detail.loading} />}
      {item && detail.kind === 'promocion' && <PromotionDetail promotion={item} />}
    </Modal>
  );
}
