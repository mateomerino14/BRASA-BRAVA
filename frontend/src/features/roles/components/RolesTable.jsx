import {Ban, Pencil, RotateCcw} from 'lucide-react';
import {ListTable} from '../../../components/organisms/ListTable';
import {ChipList} from '../../../components/molecules/ChipList';
import {Badge} from '../../../components/atoms/Badge';
import {IconButton} from '../../../components/atoms/IconButton';
import {Amount} from '../../../components/atoms/Amount';
import {cn} from '../../../lib/cn';
import {SCREEN_LABELS, VISIBLE_SCREENS} from '../constants/roles';

const styles = {
  name: 'truncate font-semibold text-carbon',
  inactiveName: 'text-cafe line-through',
  home: 'text-xs text-cafe',
  actions: 'inline-flex gap-2',
  inactiveRow: 'bg-hueso/40',
};

const peopleWord = (count) => {
  if (count === 1) {
    return 'empleado';
  }
  return 'empleados';
};

const buildColumns = ({onEdit, onToggleStatus}) => [
  {
    key: 'cargo',
    header: 'Cargo',
    sortKey: 'nombre',
    mobile: 'title',
    render: (role) => (
      <div>
        <p className={cn(styles.name, !role.activo && styles.inactiveName)}>{role.nombre}</p>
        <p className={styles.home}>{role.pantallas.length + 1} pantallas con el inicio</p>
      </div>
    ),
  },
  {
    key: 'pantallas',
    header: 'Puede entrar a',
    sortKey: 'pantallas',
    wide: true,
    render: (role) => (
      <ChipList
        label={`Pantallas de ${role.nombre}`}
        items={role.pantallas.map((screen) => ({id: screen, label: SCREEN_LABELS[screen]}))}
        visible={VISIBLE_SCREENS}
      />
    ),
  },
  {
    key: 'empleados',
    header: 'Empleados',
    sortKey: 'empleados',
    align: 'center',
    render: (role) => <Amount value={String(role.totalEmpleados)} suffix={peopleWord(role.totalEmpleados)} />,
  },
  {
    key: 'estado',
    header: 'Estado',
    sortKey: 'estado',
    align: 'center',
    render: (role) => (
      <Badge dot tone={role.activo ? 'success' : 'danger'}>
        {role.activo ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
  },
  {
    key: 'acciones',
    header: 'Acciones',
    align: 'center',
    mobile: 'actions',
    render: (role) => (
      <span className={styles.actions}>
        <IconButton icon={Pencil} tone={role.activo ? 'edit' : 'neutral'} label={`Modificar ${role.nombre}`} onClick={() => onEdit(role)} />
        <IconButton
          icon={role.activo ? Ban : RotateCcw}
          tone={role.activo ? 'danger' : 'success'}
          label={`${role.activo ? 'Dar de baja' : 'Reactivar'} ${role.nombre}`}
          onClick={() => onToggleStatus(role)}
        />
      </span>
    ),
  },
];

export function RolesTable({list, onEdit, onToggleStatus}) {
  return (
    <ListTable
      list={list}
      caption="Cargos"
      itemLabel="cargos"
      columns={buildColumns({onEdit, onToggleStatus})}
      emptyMessage="No se encontraron cargos con esos filtros"
      rowClassName={(role) => !role.activo && styles.inactiveRow}
    />
  );
}
