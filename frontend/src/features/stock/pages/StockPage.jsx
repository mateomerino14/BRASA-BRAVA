import {AlertTriangle, Boxes, PackageX, Plus} from 'lucide-react';
import {ManagementPage} from '../../../components/templates/ManagementPage';
import {ConfirmDialog} from '../../../components/organisms/ConfirmDialog';
import {FilterSelect} from '../../../components/molecules/FilterSelect';
import {StatCard} from '../../../components/molecules/StatCard';
import {IngredientsTable} from '../components/IngredientsTable';
import {IngredientFormModal} from '../components/IngredientFormModal';
import {MovementModal} from '../components/MovementModal';
import {HistoryModal} from '../components/HistoryModal';
import {useIngredients} from '../hooks/useIngredients';
import {useIngredientForm} from '../hooks/useIngredientForm';
import {useIngredientStatus} from '../hooks/useIngredientStatus';
import {useStockMovement} from '../hooks/useStockMovement';
import {useStockHistory} from '../hooks/useStockHistory';
import {LEVEL_OPTIONS, STATUS_OPTIONS} from '../constants/stock';

const statusMessage = (ingredient) => {
  if (!ingredient) {
    return '';
  }
  if (ingredient.activo) {
    return `${ingredient.nombre} dejará de contarse en las alertas y no admitirá movimientos. Su historial se conserva.`;
  }
  return `${ingredient.nombre} volverá a controlarse en stock.`;
};

const CALLOUT = {
  icon: Plus,
  title: '¿Desea registrar un nuevo insumo?',
  subtitle: 'Agregue un ingrediente o bebida con su unidad y stock mínimo.',
  actionLabel: 'Registrar insumo',
};

export function StockPage() {
  const list = useIngredients();
  const form = useIngredientForm({onSaved: list.reload});
  const status = useIngredientStatus({onChanged: list.reload});
  const movement = useStockMovement({onSaved: list.reload});
  const history = useStockHistory();
  const deactivating = Boolean(status.target?.activo);

  // Las tarjetas filtran por nivel; tocar la activa vuelve a mostrar todos
  const toggleLevel = (nivel) => {
    if (list.filters.nivel === nivel) {
      list.changeLevel('todos');
    }
    else {
      list.changeLevel(nivel);
    }
  };

  return (
    <ManagementPage
      summary={
        <>
          <StatCard icon={Boxes} label="Insumos activos" value={list.summary.total} active={list.filters.nivel === 'todos'} onClick={() => list.changeLevel('todos')} />
          <StatCard icon={AlertTriangle} tone="warning" label="Con stock bajo" value={list.summary.bajo} active={list.filters.nivel === 'bajo'} onClick={() => toggleLevel('bajo')} />
          <StatCard icon={PackageX} tone="danger" label="Sin stock" value={list.summary.sinStock} active={list.filters.nivel === 'sin_stock'} onClick={() => toggleLevel('sin_stock')} />
        </>
      }
      search={{value: list.filters.search, onChange: list.changeSearch, placeholder: 'Buscar insumo'}}
      filters={
        <>
          <FilterSelect label="Filtrar por nivel" options={LEVEL_OPTIONS} value={list.filters.nivel} onChange={list.changeLevel} />
          <FilterSelect label="Filtrar por estado" options={STATUS_OPTIONS} value={list.filters.estado} onChange={list.changeStatus} />
        </>
      }
      notice={list.notice}
      error={list.error}
      table={<IngredientsTable list={list} onEdit={form.openEdit} onToggleStatus={status.ask} onMove={(ingredient) => movement.open(ingredient)} onHistory={history.open} />}
      callout={{...CALLOUT, onAction: form.openCreate}}
    >
      <IngredientFormModal form={form} />
      <MovementModal movement={movement} />
      <HistoryModal history={history} />

      <ConfirmDialog
        open={Boolean(status.target)}
        title={deactivating ? 'Dar de baja insumo' : 'Reactivar insumo'}
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
