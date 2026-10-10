import {FolderPlus} from 'lucide-react';
import {ManagementPage} from '../../../components/templates/ManagementPage';
import {ConfirmDialog} from '../../../components/organisms/ConfirmDialog';
import {FilterSelect} from '../../../components/molecules/FilterSelect';
import {CategoriesTable} from '../components/CategoriesTable';
import {CategoryFormModal} from '../components/CategoryFormModal';
import {useCategories} from '../hooks/useCategories';
import {useCategoryForm} from '../hooks/useCategoryForm';
import {useCategoryStatus} from '../hooks/useCategoryStatus';
import {STATUS_OPTIONS} from '../constants/categories';

const statusMessage = (category) => {
  if (!category) {
    return '';
  }
  if (category.activa) {
    return `${category.nombre} y sus subcategorías dejarán de mostrarse al registrar productos y en caja. Puede reactivarla cuando quiera.`;
  }
  return `${category.nombre} volverá a estar disponible con sus subcategorías.`;
};

const CALLOUT = {
  icon: FolderPlus,
  title: '¿Desea registrar una nueva categoría?',
  subtitle: 'Organice el menú en secciones con foto y subcategorías.',
  actionLabel: 'Registrar categoría',
};

export function CategoriesPage() {
  const list = useCategories();
  const form = useCategoryForm({onSaved: list.reload});
  const status = useCategoryStatus({onChanged: list.reload});
  const deactivating = Boolean(status.target?.activa);

  return (
    <ManagementPage
      search={{value: list.filters.search, onChange: list.changeSearch, placeholder: 'Buscar categoría o subcategoría'}}
      filters={<FilterSelect label="Filtrar por estado" options={STATUS_OPTIONS} value={list.filters.estado} onChange={list.changeStatus} />}
      notice={list.notice}
      error={list.error}
      table={<CategoriesTable list={list} onEdit={form.openEdit} onToggleStatus={status.ask} />}
      callout={{...CALLOUT, onAction: form.openCreate}}
    >
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
    </ManagementPage>
  );
}
