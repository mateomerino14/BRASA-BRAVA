import {Plus} from 'lucide-react';
import {ManagementPage} from '../../../components/templates/ManagementPage';
import {ConfirmDialog} from '../../../components/organisms/ConfirmDialog';
import {FilterSelect} from '../../../components/molecules/FilterSelect';
import {IngredientsTable} from '../components/IngredientsTable';
import {IngredientFormModal} from '../components/IngredientFormModal';
import {useIngredients} from '../hooks/useIngredients';
import {useIngredientForm} from '../hooks/useIngredientForm';
import {useIngredientStatus} from '../hooks/useIngredientStatus';
import {STATUS_OPTIONS} from '../constants/stock';

const statusMessage = (ingredient) => {
  if (!ingredient) {
    return '';
  }
  if (ingredient.activo) {
    return `${ingredient.nombre} dejará de descontarse con las ventas. Podrá reactivarlo cuando quiera.`;
  }
  return `${ingredient.nombre} volverá a controlarse en el inventario.`;
};

const CALLOUT = {
  icon: Plus,
  title: '¿Desea registrar un nuevo insumo?',
  subtitle: 'Agregue un ingrediente o bebida con su cantidad y stock mínimo.',
  actionLabel: 'Registrar insumo',
};

export function StockPage() {
  const list = useIngredients();
  const form = useIngredientForm({onSaved: list.reload});
  const status = useIngredientStatus({onChanged: list.reload});
  const deactivating = Boolean(status.target?.activo);

  return (
    <ManagementPage
      search={{value: list.filters.search, onChange: list.changeSearch, placeholder: 'Buscar insumo'}}
      filters={<FilterSelect label="Filtrar por estado" options={STATUS_OPTIONS} value={list.filters.estado} onChange={list.changeStatus} />}
      error={list.error}
      table={<IngredientsTable list={list} onEdit={form.openEdit} onToggleStatus={status.ask} />}
      callout={{...CALLOUT, onAction: form.openCreate}}
    >
      <IngredientFormModal form={form} />

      <ConfirmDialog
        open={Boolean(status.target)}
        title={deactivating ? 'Dar de baja insumo' : 'Reactivar insumo'}
        message={statusMessage(status.target)}
        confirmLabel={deactivating ? 'Dar de baja' : 'Reactivar'}
        tone={deactivating ? 'danger' : 'primary'}
        loading={status.saving}
        onConfirm={status.confirm}
        onCancel={status.cancel}
      />
    </ManagementPage>
  );
}
