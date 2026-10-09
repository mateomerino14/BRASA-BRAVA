import {useState} from 'react';
import {describe, expect, it, vi} from 'vitest';
import {render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MotionConfig} from 'motion/react';
import {DataTable} from './DataTable';
import {ConfirmDialog} from './ConfirmDialog';
import {RegisterCallout} from './RegisterCallout';
import {Pagination} from '../molecules/Pagination';
import {SearchInput} from '../molecules/SearchInput';
import {Select} from '../atoms/Select';
import {Pencil, UserPlus} from 'lucide-react';
import {IconButton} from '../atoms/IconButton';

const columns = [
  {key: 'nombre', header: 'Nombre', render: (row) => row.nombre},
  {key: 'cargo', header: 'Cargo', render: (row) => row.cargo},
];

const renderStill = (ui) => render(<MotionConfig reducedMotion="always">{ui}</MotionConfig>);

describe('DataTable', () => {
  it('muestra encabezados y filas', () => {
    renderStill(<DataTable caption="Empleados" columns={columns} rows={[{id: 1, nombre: 'Andrea', cargo: 'Cajero'}]} rowKey={(row) => row.id} />);
    const table = screen.getByRole('table', {name: 'Empleados'});
    expect(within(table).getAllByRole('columnheader').map((th) => th.textContent)).toEqual(['Nombre', 'Cargo']);
    expect(within(table).getByRole('cell', {name: 'Andrea'})).toBeInTheDocument();
  });

  it('muestra el mensaje vacío y no lo muestra mientras carga', () => {
    const {rerender} = renderStill(<DataTable columns={columns} rows={[]} rowKey={(row) => row.id} emptyMessage="Sin resultados" />);
    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
    rerender(
      <MotionConfig reducedMotion="always">
        <DataTable columns={columns} rows={[]} rowKey={(row) => row.id} loading emptyMessage="Sin resultados" />
      </MotionConfig>,
    );
    expect(screen.queryByText('Sin resultados')).not.toBeInTheDocument();
  });
});

describe('Pagination', () => {
  it('marca la página actual y avisa el cambio', async () => {
    const onChange = vi.fn();
    render(<Pagination page={2} totalPages={3} onChange={onChange} />);
    expect(screen.getByRole('button', {name: 'Página 2'})).toHaveAttribute('aria-current', 'page');
    await userEvent.click(screen.getByRole('button', {name: 'Página siguiente'}));
    await userEvent.click(screen.getByRole('button', {name: 'Página 1'}));
    expect(onChange.mock.calls).toEqual([[3], [1]]);
  });

  it('deshabilita los extremos y se oculta con una sola página', () => {
    const {rerender} = render(<Pagination page={1} totalPages={2} onChange={() => {}} />);
    expect(screen.getByRole('button', {name: 'Página anterior'})).toBeDisabled();
    rerender(<Pagination page={1} totalPages={1} onChange={() => {}} />);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('muestra como máximo cinco números', () => {
    render(<Pagination page={10} totalPages={20} onChange={() => {}} />);
    const numbers = screen.getAllByRole('button', {name: /^Página \d+$/}).map((button) => button.textContent);
    expect(numbers).toEqual(['8', '9', '10', '11', '12']);
  });
});

describe('Controles de filtro', () => {
  function SearchDemo() {
    const [value, setValue] = useState('');
    return <SearchInput value={value} onChange={setValue} placeholder="Buscar empleado" />;
  }

  it('el buscador escribe y se limpia con su botón', async () => {
    render(<SearchDemo />);
    const input = screen.getByRole('searchbox', {name: 'Buscar empleado'});
    await userEvent.type(input, 'romero');
    expect(input).toHaveValue('romero');
    await userEvent.click(screen.getByRole('button', {name: 'Limpiar búsqueda'}));
    expect(input).toHaveValue('');
  });

  it('el selector muestra la opción vacía y las opciones', async () => {
    const onChange = vi.fn();
    render(<Select aria-label="Cargo" placeholder="Todos" options={[{value: '1', label: 'Mesero'}]} onChange={onChange} />);
    await userEvent.selectOptions(screen.getByRole('combobox', {name: 'Cargo'}), '1');
    expect(onChange).toHaveBeenCalled();
    expect(screen.getByRole('option', {name: 'Todos'})).toBeInTheDocument();
  });

  it('el botón de ícono tiene nombre accesible', () => {
    render(<IconButton icon={Pencil} label="Modificar" tone="edit" />);
    expect(screen.getByRole('button', {name: 'Modificar'})).toHaveClass('border-brasa');
  });
});

describe('RegisterCallout y ConfirmDialog', () => {
  it('el botón + ejecuta la acción', async () => {
    const onAction = vi.fn();
    render(<RegisterCallout icon={UserPlus} title="¿Desea registrar?" subtitle="..." actionLabel="Registrar empleado" onAction={onAction} />);
    await userEvent.click(screen.getByRole('button', {name: 'Registrar empleado'}));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('la confirmación muestra el mensaje y responde a ambos botones', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog open title="Dar de baja" message="¿Seguro?" confirmLabel="Dar de baja" error="Falló" onConfirm={onConfirm} onCancel={onCancel} />);
    const dialog = screen.getByRole('dialog', {name: 'Dar de baja'});
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Falló');
    await userEvent.click(within(dialog).getByRole('button', {name: 'Dar de baja'}));
    await userEvent.click(within(dialog).getByRole('button', {name: 'Cancelar'}));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
