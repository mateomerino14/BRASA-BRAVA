import {Ban, Pencil, RotateCcw} from 'lucide-react';
import {ListTable} from '../../../components/organisms/ListTable';
import {Avatar} from '../../../components/atoms/Avatar';
import {Badge} from '../../../components/atoms/Badge';
import {IconButton} from '../../../components/atoms/IconButton';
import {cn} from '../../../lib/cn';

const styles = {
  person: 'flex min-w-0 items-center gap-3',
  personText: 'min-w-0',
  avatar: 'ring-2 ring-arena/60',
  name: 'truncate font-semibold text-carbon',
  inactiveName: 'text-cafe line-through',
  email: 'truncate text-xs text-cafe',
  muted: 'text-cafe',
  actions: 'inline-flex gap-2',
  inactiveRow: 'bg-hueso/40',
};

const buildColumns = ({onEdit, onToggleStatus}) => [
  {
    key: 'empleado',
    header: 'Empleado',
    sortKey: 'nombre',
    mobile: 'title',
    render: (employee) => (
      <div className={styles.person}>
        <Avatar name={`${employee.nombre} ${employee.apellido}`} src={employee.fotoUrl} size={40} className={styles.avatar} />
        <div className={styles.personText}>
          <p className={cn(styles.name, !employee.activo && styles.inactiveName)}>
            {employee.nombre} {employee.apellido}
          </p>
          <p className={styles.email}>{employee.correo}</p>
        </div>
      </div>
    ),
  },
  {key: 'ci', header: 'CI', sortKey: 'ci', align: 'center', render: (employee) => employee.ci},
  {key: 'cargo', header: 'Cargo', sortKey: 'cargo', align: 'center', render: (employee) => <Badge>{employee.cargo.nombre}</Badge>},
  {key: 'usuario', header: 'Usuario', sortKey: 'usuario', align: 'center', render: (employee) => employee.alias},
  {
    key: 'telefono',
    header: 'Teléfono',
    align: 'center',
    render: (employee) => employee.telefono ?? <span className={styles.muted}>—</span>,
  },
  {
    key: 'estado',
    header: 'Estado',
    sortKey: 'estado',
    align: 'center',
    render: (employee) => (
      <Badge dot tone={employee.activo ? 'success' : 'danger'}>
        {employee.activo ? 'Activo' : 'Inhabilitado'}
      </Badge>
    ),
  },
  {
    key: 'acciones',
    header: 'Acciones',
    mobile: 'actions',
    align: 'center',
    render: (employee) => (
      <span className={styles.actions}>
        <IconButton
          icon={Pencil}
          tone={employee.activo ? 'edit' : 'neutral'}
          label={`Modificar a ${employee.nombre} ${employee.apellido}`}
          onClick={() => onEdit(employee)}
        />
        <IconButton
          icon={employee.activo ? Ban : RotateCcw}
          tone={employee.activo ? 'danger' : 'success'}
          label={`${employee.activo ? 'Dar de baja' : 'Reactivar'} a ${employee.nombre} ${employee.apellido}`}
          onClick={() => onToggleStatus(employee)}
        />
      </span>
    ),
  },
];

export function EmployeesTable({list, onEdit, onToggleStatus}) {
  return (
    <ListTable
      list={list}
      caption="Empleados"
      itemLabel="empleados"
      columns={buildColumns({onEdit, onToggleStatus})}
      emptyMessage="No se encontraron empleados con esos filtros"
      rowClassName={(employee) => !employee.activo && styles.inactiveRow}
    />
  );
}
