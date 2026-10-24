import {Plus} from 'lucide-react';
import {ManagementPage} from '../../../components/templates/ManagementPage';
import {ConfirmDialog} from '../../../components/organisms/ConfirmDialog';
import {FilterSelect} from '../../../components/molecules/FilterSelect';
import {RolesTable} from '../components/RolesTable';
import {RoleFormModal} from '../components/RoleFormModal';
import {useRoles} from '../hooks/useRoles';
import {useRoleForm} from '../hooks/useRoleForm';
import {useRoleStatus} from '../hooks/useRoleStatus';
import {STATUS_OPTIONS} from '../constants/roles';

const statusMessage = (role) => {
  if (!role) {
    return '';
  }
  if (role.activo) {
    return `${role.nombre} ya no se podrá elegir al registrar empleados. Puede reactivarlo cuando quiera.`;
  }
  return `${role.nombre} se podrá volver a elegir al registrar empleados.`;
};

const CALLOUT = {
  icon: Plus,
  title: '¿Desea registrar un nuevo cargo?',
  subtitle: 'Cree un puesto (bartender, delivery, encargado) y elija qué pantallas puede ver.',
  actionLabel: 'Registrar cargo',
};

export function RolesPage() {
  const list = useRoles();
  const form = useRoleForm({onSaved: list.reload});
  const status = useRoleStatus({onChanged: list.reload});
  const deactivating = Boolean(status.target?.activo);

  return (
    <ManagementPage
      search={{value: list.filters.search, onChange: list.changeSearch, placeholder: 'Buscar cargo'}}
      filters={<FilterSelect label="Filtrar por estado" options={STATUS_OPTIONS} value={list.filters.estado} onChange={list.changeStatus} />}
      table={<RolesTable list={list} onEdit={form.openEdit} onToggleStatus={status.ask} />}
      callout={{...CALLOUT, onAction: form.openCreate}}
    >
      <RoleFormModal form={form} />

      <ConfirmDialog
        open={Boolean(status.target)}
        title={deactivating ? 'Dar de baja cargo' : 'Reactivar cargo'}
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
