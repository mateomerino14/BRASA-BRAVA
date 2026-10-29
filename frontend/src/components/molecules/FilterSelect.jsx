import {Select} from '../atoms/Select';

const styles = {
  select: 'w-full sm:w-auto sm:min-w-44',
};

export function FilterSelect({label, options, value, onChange}) {
  return <Select size="sm" aria-label={label} className={styles.select} options={options} value={value} onChange={(event) => onChange(event.target.value)} />;
}
