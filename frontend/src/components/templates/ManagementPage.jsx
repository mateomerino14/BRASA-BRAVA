import {AnimatePresence} from 'motion/react';
import {FilterBar} from '../organisms/FilterBar';
import {RegisterCallout} from '../organisms/RegisterCallout';
import {SearchInput} from '../molecules/SearchInput';
import {Alert} from '../molecules/Alert';

const styles = {
  page: 'flex flex-col gap-6',
};

// Estructura común de toda pantalla de gestión: buscador y filtros, avisos, tabla, llamada a registrar y modales
export function ManagementPage({search, filters, notice, error, table, callout, children}) {
  return (
    <div className={styles.page}>
      <FilterBar>
        <SearchInput value={search.value} onChange={search.onChange} placeholder={search.placeholder} />
        {filters}
      </FilterBar>

      <AnimatePresence>
        {notice && <Alert key="notice" tone="success">{notice}</Alert>}
      </AnimatePresence>
      {error && <Alert tone="error">{error}</Alert>}

      {table}

      {callout && <RegisterCallout {...callout} />}

      {children}
    </div>
  );
}
