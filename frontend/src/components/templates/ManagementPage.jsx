import {FilterBar} from '../organisms/FilterBar';
import {RegisterCallout} from '../organisms/RegisterCallout';
import {SearchInput} from '../molecules/SearchInput';

const styles = {
  page: 'flex flex-col gap-6',
  summary: 'grid grid-cols-3 gap-3 sm:gap-4',
};

// Estructura común de toda pantalla de gestión: resumen opcional, buscador y filtros, tabla, llamada a registrar y modales
export function ManagementPage({summary, search, filters, table, callout, children}) {
  return (
    <div className={styles.page}>
      {summary && <section aria-label="Resumen" className={styles.summary}>{summary}</section>}

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
