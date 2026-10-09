import {AnimatePresence} from 'motion/react';
import {UserPlus} from 'lucide-react';
import {FilterBar} from '../../../components/organisms/FilterBar';
import {RegisterCallout} from '../../../components/organisms/RegisterCallout';
import {ConfirmDialog} from '../../../components/organisms/ConfirmDialog';
import {SearchInput} from '../../../components/molecules/SearchInput';
import {Alert} from '../../../components/molecules/Alert';
import {Select} from '../../../components/atoms/Select';
import {EmployeesTable} from '../components/EmployeesTable';
import {EmployeeFormModal} from '../components/EmployeeFormModal';
import {useEmployees} from '../hooks/useEmployees';
import {useEmployeeForm} from '../hooks/useEmployeeForm';
import {useEmployeeStatus} from '../hooks/useEmployeeStatus';
import {PAGE_SIZE, STATUS_OPTIONS} from '../constants/employees';

const styles = {
  page: 'flex flex-col gap-6',
  filter: 'w-full sm:w-48',
};

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

export function EmployeesPage() {
  const list = useEmployees();
  const form = useEmployeeForm({onSaved: list.reload});
  const status = useEmployeeStatus({onChanged: list.reload});
  const roleOptions = [{value: '', label: 'Todos los cargos'}, ...list.roles.map((role) => ({value: String(role.id), label: role.nombre}))];
  const deactivating = Boolean(status.target?.activo);

  return (
    <div className={styles.page}>
      <FilterBar>
        <SearchInput
          value={list.filters.search}
          onChange={list.changeSearch}
          placeholder="Buscar empleado por nombre, usuario o CI"
        />
        <Select size="sm" aria-label="Filtrar por cargo" className={styles.filter} options={roleOptions} value={list.filters.idCargo} onChange={(event) => list.changeRole(event.target.value)} />
        <Select size="sm" aria-label="Filtrar por estado" className={styles.filter} options={STATUS_OPTIONS} value={list.filters.estado} onChange={(event) => list.changeStatus(event.target.value)} />
      </FilterBar>

      <AnimatePresence>
        {list.notice && <Alert key="notice" tone="success">{list.notice}</Alert>}
      </AnimatePresence>
      {list.error && <Alert tone="error">{list.error}</Alert>}

      <EmployeesTable
        employees={list.employees}
        total={list.total}
        page={list.page}
        pageSize={PAGE_SIZE}
        totalPages={list.totalPages}
        loading={list.loading}
        onPageChange={list.setPage}
        onEdit={form.openEdit}
        onToggleStatus={status.ask}
      />

      <RegisterCallout
        icon={UserPlus}
        title="¿Desea registrar un nuevo empleado?"
        subtitle="Agregue personal, asígnele un cargo y su usuario de ingreso."
        actionLabel="Registrar empleado"
        onAction={form.openCreate}
      />

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
    </div>
  );
}
