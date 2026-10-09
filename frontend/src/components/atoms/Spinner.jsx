import {LoaderCircle} from 'lucide-react';
import {cn} from '../../lib/cn';

const styles = {
  icon: 'animate-spin',
};

export function Spinner({size = 18, className, label = 'Cargando'}) {
  return <LoaderCircle role="status" aria-label={label} size={size} className={cn(styles.icon, className)} />;
}
