import {PackagePlus} from 'lucide-react';
import {ManagementPage} from '../../../components/templates/ManagementPage';
import {ConfirmDialog} from '../../../components/organisms/ConfirmDialog';
import {FilterSelect} from '../../../components/molecules/FilterSelect';
import {ProductsTable} from '../components/ProductsTable';
import {ProductFormModal} from '../components/ProductFormModal';
import {useProducts} from '../hooks/useProducts';
import {useProductForm} from '../hooks/useProductForm';
import {useProductStatus} from '../hooks/useProductStatus';
import {useProductAvailability} from '../hooks/useProductAvailability';
import {AVAILABILITY_OPTIONS, STATUS_OPTIONS} from '../constants/products';

const statusMessage = (product) => {
  if (!product) {
    return '';
  }
  if (product.activo) {
    return `${product.nombre} dejará de mostrarse en caja y en el menú. Puede reactivarlo cuando quiera.`;
  }
  return `${product.nombre} volverá a estar disponible para la venta.`;
};

const CALLOUT = {
  icon: PackagePlus,
  title: '¿Desea registrar un nuevo producto?',
  subtitle: 'Agregue un producto al menú con su precio, categoría y foto.',
  actionLabel: 'Registrar producto',
};

const toOptions = (items, allLabel) => [{value: '', label: allLabel}, ...items.map((item) => ({value: String(item.id), label: item.nombre}))];

export function ProductsPage() {
  const list = useProducts();
  const form = useProductForm({onSaved: list.reload, categories: list.categories});
  const status = useProductStatus({onChanged: list.reload});
  const availability = useProductAvailability({onChanged: list.reload, onError: list.reportError});
  const deactivating = Boolean(status.target?.activo);
  const selectedCategory = list.categories.find((category) => String(category.id) === list.filters.idCategoria);

  return (
    <ManagementPage
      search={{value: list.filters.search, onChange: list.changeSearch, placeholder: 'Buscar producto por nombre o descripción'}}
      filters={
        <>
          <FilterSelect label="Filtrar por categoría" options={toOptions(list.categories, 'Todas las categorías')} value={list.filters.idCategoria} onChange={list.changeCategory} />
          {selectedCategory && (
            <FilterSelect label="Filtrar por subcategoría" options={toOptions(selectedCategory.subcategorias, 'Todas las subcategorías')} value={list.filters.idSubcategoria} onChange={list.changeSubcategory} />
          )}
          <FilterSelect label="Filtrar por estado" options={STATUS_OPTIONS} value={list.filters.estado} onChange={list.changeStatus} />
          <FilterSelect label="Filtrar por disponibilidad" options={AVAILABILITY_OPTIONS} value={list.filters.disponibilidad} onChange={list.changeAvailability} />
        </>
      }
      notice={list.notice}
      error={list.error}
      table={<ProductsTable list={list} onEdit={form.openEdit} onToggleStatus={status.ask} availability={availability} />}
      callout={{...CALLOUT, onAction: form.openCreate}}
    >
      <ProductFormModal form={form} categories={list.categories} />

      <ConfirmDialog
        open={Boolean(status.target)}
        title={deactivating ? 'Dar de baja producto' : 'Reactivar producto'}
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
