import {useId} from 'react';
import {Select} from '../atoms/Select';
import {PAGE_SIZE_OPTIONS} from '../../config/lists';

const styles = {
  wrapper: 'flex items-center gap-2',
  label: 'whitespace-nowrap',
  select: 'w-20',
};

const OPTIONS = PAGE_SIZE_OPTIONS.map((size) => ({value: String(size), label: String(size)}));

// Selector de cuántas filas se muestran por página
export function PageSizeSelect({value, onChange}) {
  const id = useId();
  return (
    <div className={styles.wrapper}>
      <label htmlFor={id} className={styles.label}>Filas por página</label>
      <Select id={id} size="sm" className={styles.select} options={OPTIONS} value={String(value)} onChange={(event) => onChange(Number(event.target.value))} />
    </div>
  );
}
