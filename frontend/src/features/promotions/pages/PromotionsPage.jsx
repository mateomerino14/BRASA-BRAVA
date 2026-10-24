import {Plus} from 'lucide-react';
import {ManagementPage} from '../../../components/templates/ManagementPage';
import {ConfirmDialog} from '../../../components/organisms/ConfirmDialog';
import {FilterSelect} from '../../../components/molecules/FilterSelect';
import {PromotionsTable} from '../components/PromotionsTable';
import {PromotionFormModal} from '../components/PromotionFormModal';
import {usePromotions} from '../hooks/usePromotions';
import {usePromotionForm} from '../hooks/usePromotionForm';
import {usePromotionStatus} from '../hooks/usePromotionStatus';
import {STATUS_OPTIONS, VIGENCIA_OPTIONS} from '../constants/promotions';

const statusMessage = (promotion) => {
  if (!promotion) {
    return '';
  }
  if (promotion.activa) {
    return `${promotion.nombre} dejará de aplicarse en caja aunque esté dentro de sus fechas.`;
  }
  return `${promotion.nombre} volverá a aplicarse en sus fechas y días.`;
};

const CALLOUT = {
  icon: Plus,
  title: '¿Desea registrar una nueva promoción?',
  subtitle: 'Arme un combo de productos para días y fechas específicas.',
  actionLabel: 'Registrar promoción',
};

export function PromotionsPage() {
  const list = usePromotions();
  const form = usePromotionForm({onSaved: list.reload, today: list.today, products: list.products});
  const status = usePromotionStatus({onChanged: list.reload});
  const deactivating = Boolean(status.target?.activa);

  return (
    <ManagementPage
      search={{value: list.filters.search, onChange: list.changeSearch, placeholder: 'Buscar promoción o producto'}}
      filters={
        <>
          <FilterSelect label="Filtrar por vigencia" options={VIGENCIA_OPTIONS} value={list.filters.vigencia} onChange={list.changeVigencia} />
          <FilterSelect label="Filtrar por estado" options={STATUS_OPTIONS} value={list.filters.estado} onChange={list.changeStatus} />
        </>
      }
      table={<PromotionsTable list={list} onEdit={form.openEdit} onToggleStatus={status.ask} />}
      callout={{...CALLOUT, onAction: form.openCreate}}
    >
      <PromotionFormModal form={form} />

      <ConfirmDialog
        open={Boolean(status.target)}
        title={deactivating ? 'Dar de baja promoción' : 'Reactivar promoción'}
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
