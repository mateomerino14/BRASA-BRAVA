import {cn} from '../../lib/cn';
import {getInitials} from '../../lib/format';

const styles = {
  photo: 'rounded-full object-cover',
  initials: 'inline-flex items-center justify-center rounded-full bg-carbon font-display text-crema',
};

const initialsScale = 0.4;

export function Avatar({name, src, size = 40, className}) {
  const sizeStyle = {width: size, height: size, fontSize: size * initialsScale};

  if (src) {
    return <img src={src} alt={name} style={sizeStyle} className={cn(styles.photo, className)} />;
  }
  return (
    <span role="img" aria-label={name} style={sizeStyle} className={cn(styles.initials, className)}>
      {getInitials(name)}
    </span>
  );
}
