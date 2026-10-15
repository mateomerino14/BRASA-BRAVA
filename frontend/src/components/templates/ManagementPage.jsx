import {FilterBar} from '../organisms/FilterBar';
import {RegisterCallout} from '../organisms/RegisterCallout';
import {SearchInput} from '../molecules/SearchInput';
import {Alert} from '../molecules/Alert';

const styles = {
  page: 'flex flex-col gap-6',
  summary: 'grid grid-cols-3 gap-3 sm:gap-4',
};

// Estructura común de toda pantalla de gestión: resumen opcional, buscador y filtros, error de carga, tabla, llamada a registrar y modales
export function ManagementPage({summary, search, filters, error, table, callout, children}) {
  return (
    <div className={styles.page}>
      {summary && <section aria-label="Resumen" className={styles.summary}>{summary}</section>}

      <FilterBar>
        <SearchInput value={search.value} onChange={search.onChange} placeholder={search.placeholder} />
        {filters}
      </FilterBar>

      {error && <Alert tone="error">{error}</Alert>}

      {table}

      {callout && <RegisterCallout {...callout} />}

      {children}
    </div>
  );
}
