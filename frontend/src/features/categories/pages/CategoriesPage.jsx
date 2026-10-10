import {AnimatePresence} from 'motion/react';
import {FolderPlus} from 'lucide-react';
import {FilterBar} from '../../../components/organisms/FilterBar';
import {RegisterCallout} from '../../../components/organisms/RegisterCallout';
import {ConfirmDialog} from '../../../components/organisms/ConfirmDialog';
import {SearchInput} from '../../../components/molecules/SearchInput';
import {Alert} from '../../../components/molecules/Alert';
import {Select} from '../../../components/atoms/Select';
import {CategoriesTable} from '../components/CategoriesTable';
import {CategoryFormModal} from '../components/CategoryFormModal';
import {useCategories} from '../hooks/useCategories';
import {useCategoryForm} from '../hooks/useCategoryForm';
import {useCategoryStatus} from '../hooks/useCategoryStatus';
import {STATUS_OPTIONS} from '../constants/categories';

const styles = {
  page: 'flex flex-col gap-6',
  filter: 'w-full sm:w-48',
};

const statusMessage = (category) => {
  if (!category) {
    return '';
  }
  if (category.activa) {
    return `${category.nombre} y sus subcategorías dejarán de mostrarse al registrar productos y en caja. Puede reactivarla cuando quiera.`;
  }
  return `${category.nombre} volverá a estar disponible con sus subcategorías.`;
};

export function CategoriesPage() {
  const list = useCategories();
  const form = useCategoryForm({onSaved: list.reload});
  const status = useCategoryStatus({onChanged: list.reload});
  const deactivating = Boolean(status.target?.activa);

  return (
    <div className={styles.page}>
      <FilterBar>
        <SearchInput value={list.filters.search} onChange={list.changeSearch} placeholder="Buscar categoría o subcategoría" />
        <Select size="sm" aria-label="Filtrar por estado" className={styles.filter} options={STATUS_OPTIONS} value={list.filters.estado} onChange={(event) => list.changeStatus(event.target.value)} />
      </FilterBar>

      <AnimatePresence>
        {list.notice && <Alert key="notice" tone="success">{list.notice}</Alert>}
      </AnimatePresence>
      {list.error && <Alert tone="error">{list.error}</Alert>}

      <CategoriesTable
        categories={list.categories}
        total={list.total}
        page={list.page}
        pageSize={list.pageSize}
        totalPages={list.totalPages}
        loading={list.loading}
        onPageChange={list.setPage}
        onEdit={form.openEdit}
        onToggleStatus={status.ask}
      />

      <RegisterCallout
        icon={FolderPlus}
        title="¿Desea registrar una nueva categoría?"
        subtitle="Organice el menú en secciones con foto y subcategorías."
        actionLabel="Registrar categoría"
        onAction={form.openCreate}
      />

      <CategoryFormModal form={form} />

      <ConfirmDialog
        open={Boolean(status.target)}
        title={deactivating ? 'Dar de baja categoría' : 'Reactivar categoría'}
        message={statusMessage(status.target)}
        confirmLabel={deactivating ? 'Dar de baja' : 'Reactivar'}
        tone={deactivating ? 'danger' : 'primary'}
        loading={status.saving}
        error={status.modalError}
        onConfirm={status.confirm}
        onCancel={status.cancel}
      />
    </div>
  );
}
