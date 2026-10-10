import {ImageOff} from 'lucide-react';
import {cn} from '../../lib/cn';
import {resolveAssetUrl} from '../../lib/apiClient';

const styles = {
  base: 'shrink-0 overflow-hidden rounded-xl border border-arena/60 bg-hueso',
  image: 'size-full object-cover',
  empty: 'flex items-center justify-center text-cafe/60',
  muted: 'grayscale opacity-60',
};

const iconScale = 0.4;

export function Thumbnail({src, alt, size = 48, muted = false, className}) {
  const sizeStyle = {width: size, height: size};

  if (src) {
    return (
      <span style={sizeStyle} className={cn(styles.base, muted && styles.muted, className)}>
        <img src={resolveAssetUrl(src)} alt={alt} className={styles.image} />
      </span>
    );
  }
  return (
    <span role="img" aria-label={`${alt} (sin imagen)`} style={sizeStyle} className={cn(styles.base, styles.empty, className)}>
      <ImageOff size={size * iconScale} aria-hidden />
    </span>
  );
}
