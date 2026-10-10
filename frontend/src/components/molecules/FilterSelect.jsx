import {Select} from '../atoms/Select';

const styles = {
  select: 'w-full sm:w-48',
};

// Selector compacto con el ancho estándar de la barra de filtros
export function FilterSelect({label, options, value, onChange}) {
  return <Select size="sm" aria-label={label} className={styles.select} options={options} value={value} onChange={(event) => onChange(event.target.value)} />;
}
