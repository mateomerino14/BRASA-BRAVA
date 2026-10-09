import logoUrl from '../../assets/logo.png';
import {cn} from '../../lib/cn';

const styles = {
  image: 'rounded-full',
  glow: 'animate-ember',
};

export function Logo({size = 160, glow = false, className}) {
  return (
    <img
      src={logoUrl}
      alt="Brasa Brava Resto-Bar"
      width={size}
      height={size}
      className={cn(styles.image, glow && styles.glow, className)}
    />
  );
}
