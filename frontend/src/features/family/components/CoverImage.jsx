import {UtensilsCrossed} from 'lucide-react';
import {resolveAssetUrl} from '../../../lib/apiClient';
import {cn} from '../../../lib/cn';

const styles = {
  frame: 'relative aspect-[16/10] w-full overflow-hidden bg-hueso',
  image: 'size-full object-cover transition-transform duration-500 group-hover:scale-105',
  empty: 'flex size-full items-center justify-center text-cafe/40',
  muted: 'grayscale opacity-70',
};

export function CoverImage({src, alt, muted = false, className, children}) {
  return (
    <div className={cn(styles.frame, className)}>
      {src ? (
        <img src={resolveAssetUrl(src)} alt={alt} className={cn(styles.image, muted && styles.muted)} />
      ) : (
        <span role="img" aria-label={`${alt} (sin imagen)`} className={styles.empty}>
          <UtensilsCrossed size={40} aria-hidden />
        </span>
      )}
      {children}
    </div>
  );
}
