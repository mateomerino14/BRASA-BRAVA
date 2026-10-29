import {Ban, Pencil, RotateCcw} from 'lucide-react';
import {ListTable} from '../../../components/organisms/ListTable';
import {ChipList} from '../../../components/molecules/ChipList';
import {Badge} from '../../../components/atoms/Badge';
import {IconButton} from '../../../components/atoms/IconButton';
import {Amount} from '../../../components/atoms/Amount';
import {cn} from '../../../lib/cn';
import {capacityGroups} from '../utils/sectionForm';
import {VISIBLE_GROUPS} from '../constants/sections';

const styles = {
  section: 'min-w-0',
  name: 'truncate font-semibold text-carbon',
  inactiveName: 'text-cafe line-through',
  description: 'truncate text-xs text-cafe lg:max-w-60',
  actions: 'inline-flex gap-2',
  group: 'whitespace-nowrap rounded-lg bg-hueso px-3 py-1 text-[13px] font-semibold text-carbon',
  groupCount: 'font-display text-xl leading-none text-brasa-oscuro',
  groupPeople: 'font-display text-xl leading-none',
  groupWord: 'font-medium text-cafe',
  inactiveRow: 'bg-hueso/40',
};

const pluralize = (count, singular, plural) => {
  if (count === 1) {
    return singular;
  }
  return plural;
};

function GroupLabel({tables, capacity}) {
  return (
    <>
      <span className={styles.groupCount}>{tables}</span> {pluralize(tables, 'mesa', 'mesas')} <span className={styles.groupWord}>de</span>{' '}
      <span className={styles.groupPeople}>{capacity}</span> <span className={styles.groupWord}>{pluralize(capacity, 'persona', 'personas')}</span>
    </>
  );
}

const buildColumns = ({onEdit, onToggleStatus}) => [
  {
    key: 'seccion',
    header: 'Sección',
    sortKey: 'nombre',
    mobile: 'title',
    render: (section) => (
      <div className={styles.section}>
        <p className={cn(styles.name, !section.activa && styles.inactiveName)}>{section.nombre}</p>
        {section.descripcion && <p className={styles.description} title={section.descripcion}>{section.descripcion}</p>}
      </div>
    ),
  },
  {
    key: 'listaMesas',
    header: 'Mesas',
    wide: true,
    render: (section) => (
      <ChipList
        label={`Mesas de ${section.nombre}`}
        items={capacityGroups(section.mesas).map(({capacidad, mesas}) => ({id: capacidad, label: <GroupLabel tables={mesas} capacity={capacidad} />}))}
        visible={VISIBLE_GROUPS}
        chipClassName={styles.group}
      />
    ),
  },
  {key: 'mesas', header: 'Total', sortKey: 'mesas', align: 'center', render: (section) => <Amount value={String(section.totalMesas)} suffix={pluralize(section.totalMesas, 'mesa', 'mesas')} />},
  {key: 'capacidad', header: 'Capacidad', sortKey: 'capacidad', align: 'center', render: (section) => <Amount value={String(section.capacidad)} suffix={pluralize(section.capacidad, 'persona', 'personas')} />},
  {
    key: 'estado',
    header: 'Estado',
    sortKey: 'estado',
    align: 'center',
    render: (section) => (
      <Badge dot tone={section.activa ? 'success' : 'danger'}>
        {section.activa ? 'Activa' : 'Inactiva'}
      </Badge>
    ),
  },
  {
    key: 'acciones',
    header: 'Acciones',
    align: 'center',
    mobile: 'actions',
    render: (section) => (
      <span className={styles.actions}>
        <IconButton icon={Pencil} tone={section.activa ? 'edit' : 'neutral'} label={`Modificar ${section.nombre}`} onClick={() => onEdit(section)} />
        <IconButton
          icon={section.activa ? Ban : RotateCcw}
          tone={section.activa ? 'danger' : 'success'}
          label={`${section.activa ? 'Dar de baja' : 'Reactivar'} ${section.nombre}`}
          onClick={() => onToggleStatus(section)}
        />
      </span>
    ),
  },
];

export function SectionsTable({list, onEdit, onToggleStatus}) {
  return (
    <ListTable
      list={list}
      caption="Secciones"
      itemLabel="secciones"
      columns={buildColumns({onEdit, onToggleStatus})}
      emptyMessage="No se encontraron secciones con esos filtros"
      rowClassName={(section) => !section.activa && styles.inactiveRow}
    />
  );
}
