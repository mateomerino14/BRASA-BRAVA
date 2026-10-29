import {useState} from 'react';
import {fn} from 'storybook/test';
import {Pencil, Ban, UserPlus} from 'lucide-react';
import {DataTable} from './DataTable';
import {FilterBar} from './FilterBar';
import {RegisterCallout} from './RegisterCallout';
import {ConfirmDialog} from './ConfirmDialog';
import {SearchInput} from '../molecules/SearchInput';
import {Pagination} from '../molecules/Pagination';
import {Select} from '../atoms/Select';
import {Badge} from '../atoms/Badge';
import {IconButton} from '../atoms/IconButton';
import {Button} from '../atoms/Button';

export default {title: 'Organismos/Administración', parameters: {layout: 'padded'}};

const ROWS = [
  {id: 1, nombre: 'Carlos Mendoza', cargo: 'Mesero', activo: true},
  {id: 2, nombre: 'Andrea Romero', cargo: 'Cajero', activo: true},
  {id: 3, nombre: 'Javier Ortiz', cargo: 'Mesero', activo: false},
];

const COLUMNS = [
  {key: 'nombre', header: 'Empleado', mobile: 'title', render: (row) => row.nombre},
  {key: 'cargo', header: 'Cargo', align: 'center', render: (row) => <Badge>{row.cargo}</Badge>},
  {
    key: 'estado',
    header: 'Estado',
    align: 'center',
    render: (row) => <Badge dot tone={row.activo ? 'success' : 'danger'}>{row.activo ? 'Activo' : 'Inactivo'}</Badge>,
  },
  {
    key: 'acciones',
    mobile: 'actions',
    header: 'Acciones',
    align: 'center',
    render: () => (
      <span className="inline-flex gap-2">
        <IconButton icon={Pencil} label="Modificar" tone="edit" />
        <IconButton icon={Ban} label="Dar de baja" tone="danger" />
      </span>
    ),
  },
];

function TableDemo() {
  const [page, setPage] = useState(1);
  return (
    <DataTable
      caption="Empleados"
      columns={COLUMNS}
      rows={ROWS}
      rowKey={(row) => row.id}
      footer={
        <>
          <span>Mostrando 3 de 12 empleados</span>
          <Pagination page={page} totalPages={4} onChange={setPage} />
        </>
      }
    />
  );
}

export const Tabla = {render: () => <TableDemo />};
export const TablaCargando = {render: () => <DataTable columns={COLUMNS} rows={[]} rowKey={(row) => row.id} loading />};
export const TablaVacia = {
  render: () => <DataTable columns={COLUMNS} rows={[]} rowKey={(row) => row.id} emptyMessage="No se encontraron empleados" />,
};

function FilterDemo() {
  const [search, setSearch] = useState('');
  return (
    <FilterBar>
      <SearchInput value={search} onChange={setSearch} placeholder="Buscar empleado por nombre" />
      <Select size="sm" className="w-44" aria-label="Cargo" placeholder="Todos los cargos" options={[{value: '1', label: 'Mesero'}]} />
    </FilterBar>
  );
}

export const BarraDeFiltros = {render: () => <FilterDemo />};

export const LlamadaARegistrar = {
  render: () => (
    <RegisterCallout
      icon={UserPlus}
      title="¿Desea registrar un nuevo empleado?"
      subtitle="Agregue personal y asígnele un cargo."
      actionLabel="Registrar empleado"
      onAction={fn()}
    />
  ),
};

function ConfirmDemo() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>Dar de baja</Button>
      <ConfirmDialog
        open={open}
        title="Dar de baja"
        message="Andrea Romero ya no podrá iniciar sesión. Puede reactivarla cuando quiera."
        confirmLabel="Dar de baja"
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}

export const Confirmacion = {render: () => <ConfirmDemo />};

export const TablaComoTarjetas = {
  globals: {viewport: {value: 'mobile2'}},
  render: () => <TableDemo />,
};
