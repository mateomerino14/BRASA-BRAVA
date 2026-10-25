import {Ban, TriangleAlert} from 'lucide-react';
import {cn} from '../../../lib/cn';
import {resolveAssetUrl} from '../../../lib/apiClient';
import {productStatus} from '../utils/family';

const styles = {
  cover: 'relative block w-full overflow-hidden bg-carbon',
  image: 'absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105',
  plain: 'absolute inset-0 bg-grill p-4',
  plainLabel: 'relative font-display text-2xl leading-none tracking-wide text-mostaza',
  plainInitials: 'pointer-events-none absolute -right-2 -top-5 font-display text-[110px] leading-none text-white/[0.06]',
  muted: 'grayscale opacity-70',
  shade: 'absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-carbon/80 to-transparent',
  photoLabel: 'absolute left-4 top-4 font-display text-2xl leading-none tracking-wide text-mostaza drop-shadow',
  band: 'absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-4 py-1.5 text-xs font-bold uppercase tracking-wider',
  bandLabel: 'flex shrink-0 items-center gap-1.5',
  bandHint: 'truncate font-semibold normal-case tracking-normal opacity-90',
};

const BANDS = {
  agotado: {className: 'bg-rojo text-white', hint: 'No se vende hoy', icon: Ban},
  sinStock: {className: 'bg-carbon text-crema', hint: 'Falta un insumo', icon: TriangleAlert},
  pocas: {className: 'bg-mostaza text-carbon', hint: 'Avise a cocina', icon: TriangleAlert},
};

const initials = (text) => text.split(/\s+/).filter((word) => word.length > 2).slice(0, 2).map((word) => word[0]).join('').toUpperCase();

export function ProductCover({product, hint, className}) {
  const status = productStatus(product);
  const muted = status?.key === 'agotado';
  const band = status && BANDS[status.key];
  const BandIcon = band?.icon;

  let picture = (
    <span role="img" aria-label={`${product.nombre} (sin imagen)`} className={cn(styles.plain, muted && styles.muted)}>
      <span aria-hidden className={styles.plainInitials}>{initials(product.nombre)}</span>
      <span aria-hidden className={styles.plainLabel}>{product.subcategoria}</span>
    </span>
  );
  if (product.imagenUrl) {
    picture = (
      <>
        <img src={resolveAssetUrl(product.imagenUrl)} alt={product.nombre} className={cn(styles.image, muted && styles.muted)} />
        <span aria-hidden className={styles.shade} />
        <span aria-hidden className={styles.photoLabel}>{product.subcategoria}</span>
      </>
    );
  }

  return (
    <span className={cn(styles.cover, className)}>
      {picture}
      {band && (
        <span className={cn(styles.band, band.className)}>
          <span className={styles.bandLabel}><BandIcon size={13} aria-hidden />{status.label}</span>
          <span className={styles.bandHint}>{hint ?? band.hint}</span>
        </span>
      )}
    </span>
  );
}
