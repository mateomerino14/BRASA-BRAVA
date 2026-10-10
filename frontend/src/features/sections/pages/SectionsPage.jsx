import {Armchair, LayoutGrid, Plus, Users} from 'lucide-react';
import {ManagementPage} from '../../../components/templates/ManagementPage';
import {ConfirmDialog} from '../../../components/organisms/ConfirmDialog';
import {FilterSelect} from '../../../components/molecules/FilterSelect';
import {StatCard} from '../../../components/molecules/StatCard';
import {SectionsTable} from '../components/SectionsTable';
import {SectionFormModal} from '../components/SectionFormModal';
import {useSections} from '../hooks/useSections';
import {useSectionForm} from '../hooks/useSectionForm';
import {useSectionStatus} from '../hooks/useSectionStatus';
import {STATUS_OPTIONS} from '../constants/sections';

const statusMessage = (section) => {
  if (!section) {
    return '';
  }
  if (section.activa) {
    return `${section.nombre} y sus ${section.totalMesas} mesas dejarán de aparecer en caja. Puede reactivarla cuando quiera.`;
  }
  return `${section.nombre} volverá a estar disponible en caja con sus mesas.`;
};

const CALLOUT = {
  icon: Plus,
  title: '¿Desea registrar una nueva sección?',
  subtitle: 'Agregue un ambiente del local (salón, terraza, barra) con sus mesas.',
  actionLabel: 'Registrar sección',
};

export function SectionsPage() {
  const list = useSections();
  const form = useSectionForm({onSaved: list.reload});
  const status = useSectionStatus({onChanged: list.reload});
  const deactivating = Boolean(status.target?.activa);

  return (
    <ManagementPage
      summary={
        <>
          <StatCard icon={LayoutGrid} label="Secciones activas" value={list.summary.secciones} />
          <StatCard icon={Armchair} label="Mesas disponibles" value={list.summary.mesas} />
          <StatCard icon={Users} label="Personas sentadas" value={list.summary.capacidad} />
        </>
      }
      search={{value: list.filters.search, onChange: list.changeSearch, placeholder: 'Buscar sección o mesa'}}
      filters={<FilterSelect label="Filtrar por estado" options={STATUS_OPTIONS} value={list.filters.estado} onChange={list.changeStatus} />}
      notice={list.notice}
      error={list.error}
      table={<SectionsTable list={list} onEdit={form.openEdit} onToggleStatus={status.ask} />}
      callout={{...CALLOUT, onAction: form.openCreate}}
    >
      <SectionFormModal form={form} />

      <ConfirmDialog
        open={Boolean(status.target)}
        title={deactivating ? 'Dar de baja sección' : 'Reactivar sección'}
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
