import {UserPlus} from 'lucide-react';
import {ManagementPage} from '../../../components/templates/ManagementPage';
import {ConfirmDialog} from '../../../components/organisms/ConfirmDialog';
import {FilterSelect} from '../../../components/molecules/FilterSelect';
import {EmployeesTable} from '../components/EmployeesTable';
import {EmployeeFormModal} from '../components/EmployeeFormModal';
import {useEmployees} from '../hooks/useEmployees';
import {useEmployeeForm} from '../hooks/useEmployeeForm';
import {useEmployeeStatus} from '../hooks/useEmployeeStatus';
import {STATUS_OPTIONS} from '../constants/employees';

const statusMessage = (employee) => {
  if (!employee) {
    return '';
  }
  const fullName = `${employee.nombre} ${employee.apellido}`;
  if (employee.activo) {
    return `${fullName} ya no podrá iniciar sesión. Puede reactivar su acceso cuando quiera.`;
  }
  return `${fullName} podrá volver a iniciar sesión con su usuario y contraseña.`;
};

const CALLOUT = {
  icon: UserPlus,
  title: '¿Desea registrar un nuevo empleado?',
  subtitle: 'Agregue personal, asígnele un cargo y su usuario de ingreso.',
  actionLabel: 'Registrar empleado',
};

export function EmployeesPage() {
  const list = useEmployees();
  const form = useEmployeeForm({onSaved: list.reload});
  const status = useEmployeeStatus({onChanged: list.reload});
  const roleOptions = [{value: '', label: 'Todos los cargos'}, ...list.roles.map((role) => ({value: String(role.id), label: role.nombre}))];
  const deactivating = Boolean(status.target?.activo);

  return (
    <ManagementPage
      search={{value: list.filters.search, onChange: list.changeSearch, placeholder: 'Buscar empleado por nombre, usuario o CI'}}
      filters={
        <>
          <FilterSelect label="Filtrar por cargo" options={roleOptions} value={list.filters.idCargo} onChange={list.changeRole} />
          <FilterSelect label="Filtrar por estado" options={STATUS_OPTIONS} value={list.filters.estado} onChange={list.changeStatus} />
        </>
      }
      notice={list.notice}
      error={list.error}
      table={<EmployeesTable list={list} onEdit={form.openEdit} onToggleStatus={status.ask} />}
      callout={{...CALLOUT, onAction: form.openCreate}}
    >
      <EmployeeFormModal form={form} roles={list.roles} />

      <ConfirmDialog
        open={Boolean(status.target)}
        title={deactivating ? 'Dar de baja' : 'Reactivar empleado'}
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
