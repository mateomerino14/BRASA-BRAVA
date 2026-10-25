import {Ban, CalendarClock, CalendarX, Flame} from 'lucide-react';
import {cn} from '../../../lib/cn';
import {countText} from '../../../lib/format';
import {resolveAssetUrl} from '../../../lib/apiClient';
import {promotionBand} from '../utils/family';

const styles = {
  cover: 'relative block w-full overflow-hidden bg-carbon bg-grill',
  image: 'absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105',
  shade: 'absolute inset-0 bg-gradient-to-b from-carbon/85 via-carbon/40 to-transparent',
  text: 'absolute inset-x-4 top-4',
  textWide: 'sm:inset-x-8 sm:top-6',
  kicker: 'block text-[11px] font-bold uppercase tracking-wider text-mostaza',
  name: 'mt-1 block font-display leading-[0.95] tracking-wide text-crema',
  nameSizes: {md: 'text-[28px]', lg: 'text-4xl'},
  dim: 'opacity-60',
  band: 'absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-4 py-1.5 text-xs font-bold uppercase tracking-wider',
  bandWide: 'sm:px-8',
  bandLabel: 'flex shrink-0 items-center gap-1.5',
  bandHint: 'truncate font-semibold normal-case tracking-normal opacity-90',
};

const BANDS = {
  noSeVende: {className: 'bg-rojo text-white', icon: Ban},
  hoy: {className: 'bg-brasa text-white', icon: Flame},
  programada: {className: 'bg-mostaza text-carbon', icon: CalendarClock},
  otroDia: {className: 'border-t border-white/10 bg-carbon text-crema', icon: CalendarX},
};

export function PromotionCover({promotion, size = 'md', className}) {
  const band = promotionBand(promotion);
  const look = BANDS[band.key];
  const Icon = look.icon;
  const wide = size === 'lg';
  const off = band.key === 'noSeVende';

  return (
    <span aria-hidden className={cn(styles.cover, className)}>
      {promotion.imagenUrl && (
        <>
          <img src={resolveAssetUrl(promotion.imagenUrl)} alt="" className={cn(styles.image, off && 'grayscale')} />
          <span className={styles.shade} />
        </>
      )}
      <span className={cn(styles.text, wide && styles.textWide, off && styles.dim)}>
        <span className={styles.kicker}>Combo · {countText(promotion.productos.length, 'producto', 'productos')}</span>
        <span className={cn(styles.name, styles.nameSizes[size])}>{promotion.nombre}</span>
      </span>
      <span className={cn(styles.band, wide && styles.bandWide, look.className)}>
        <span className={styles.bandLabel}><Icon size={13} />{band.label}</span>
        <span className={styles.bandHint}>{band.hint}</span>
      </span>
    </span>
  );
}
