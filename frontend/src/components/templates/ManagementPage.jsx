import {FilterBar} from '../organisms/FilterBar';
import {RegisterCallout} from '../organisms/RegisterCallout';
import {SearchInput} from '../molecules/SearchInput';

const styles = {
  page: 'flex flex-col gap-6',
};

// Estructura común de toda pantalla de gestión: buscador y filtros, tabla, llamada a registrar y modales
export function ManagementPage({search, filters, table, callout, children}) {
  return (
    <div className={styles.page}>
      <FilterBar>
        <SearchInput value={search.value} onChange={search.onChange} placeholder={search.placeholder} />
        {filters}
      </FilterBar>

      {table}

      {callout && <RegisterCallout {...callout} />}

      {children}
    </div>
  );
}
