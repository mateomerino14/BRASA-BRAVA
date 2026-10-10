import {FilterX} from 'lucide-react';
import {DataTable} from './DataTable';
import {Pagination} from '../molecules/Pagination';
import {PageSizeSelect} from '../molecules/PageSizeSelect';
import {Button} from '../atoms/Button';
import {rangeText} from '../../lib/format';

const styles = {
  range: 'min-w-0',
  controls: 'flex flex-wrap items-center gap-4',
};

// Tabla estándar de las pantallas de gestión: orden, filas por página, paginación y "Limpiar filtros" en un solo lugar.
// Recibe el resultado de usePaginatedList en "list".
export function ListTable({list, columns, caption, itemLabel, emptyMessage, rowKey = (row) => row.id, rowClassName}) {
  let emptyAction;
  if (list.hasActiveFilters) {
    emptyAction = (
      <Button size="sm" variant="outline" icon={<FilterX size={16} aria-hidden />} onClick={list.clearFilters}>
        Limpiar filtros
      </Button>
    );
  }

  return (
    <DataTable
      caption={caption}
      columns={columns}
      rows={list.items}
      rowKey={rowKey}
      loading={list.loading}
      emptyMessage={emptyMessage}
      emptyAction={emptyAction}
      rowClassName={rowClassName}
      sort={list.sort}
      onSort={list.changeSort}
      footer={
        <>
          <span className={styles.range}>{rangeText({page: list.page, pageSize: list.pageSize, count: list.items.length, total: list.total, itemLabel})}</span>
          <div className={styles.controls}>
            <PageSizeSelect value={list.pageSize} onChange={list.changePageSize} />
            <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} />
          </div>
        </>
      }
    />
  );
}
