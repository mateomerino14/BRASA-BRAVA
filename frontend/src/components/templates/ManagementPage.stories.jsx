import {useState} from 'react';
import {fn} from 'storybook/test';
import {Package} from 'lucide-react';
import {ManagementPage} from './ManagementPage';
import {ListTable} from '../organisms/ListTable';
import {FilterSelect} from '../molecules/FilterSelect';
import {PageSizeSelect} from '../molecules/PageSizeSelect';
import {Badge} from '../atoms/Badge';
import {STATUS_OPTIONS} from '../../config/lists';
import {fakeList} from '../../stories/fakeList';

export default {title: 'Plantillas/Pantalla de gestión', parameters: {layout: 'padded'}};

const ROWS = [
  {id: 1, nombre: 'Hamburguesa Clásica', categoria: 'Hamburguesas', precio: 'Bs 35,00', activo: true},
  {id: 2, nombre: 'Papas Fritas', categoria: 'Guarniciones', precio: 'Bs 15,00', activo: true},
  {id: 3, nombre: 'Combo Familiar', categoria: 'Combos', precio: 'Bs 120,00', activo: false},
];

const COLUMNS = [
  {key: 'nombre', header: 'Nombre', sortKey: 'nombre', mobile: 'title', render: (row) => row.nombre},
  {key: 'categoria', header: 'Categoría', render: (row) => row.categoria},
  {key: 'precio', header: 'Precio', sortKey: 'precio', align: 'right', render: (row) => row.precio},
  {key: 'estado', header: 'Estado', align: 'center', render: (row) => <Badge dot tone={row.activo ? 'success' : 'danger'}>{row.activo ? 'Activo' : 'Inactivo'}</Badge>},
];

const toggleDirection = (sort, key) => {
  if (sort.key === key && sort.dir === 'asc') {
    return 'desc';
  }
  return 'asc';
};

function Demo({rows = ROWS, notice = ''}) {
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('todos');
  const [sort, setSort] = useState({key: '', dir: 'asc'});
  const [pageSize, setPageSize] = useState(5);
  const list = fakeList({
    items: rows,
    total: rows.length,
    pageSize,
    sort,
    hasActiveFilters: rows.length === 0,
    handlers: {
      changeSort: (key, dir) => setSort({key, dir: dir ?? toggleDirection(sort, key)}),
      changePageSize: setPageSize,
      clearFilters: fn(),
    },
  });
  return (
    <ManagementPage
      search={{value: search, onChange: setSearch, placeholder: 'Buscar producto'}}
      filters={<FilterSelect label="Filtrar por estado" options={STATUS_OPTIONS} value={estado} onChange={setEstado} />}
      notice={notice}
      table={<ListTable list={list} columns={COLUMNS} caption="Productos" itemLabel="productos" emptyMessage="No se encontraron productos con esos filtros" />}
      callout={{icon: Package, title: '¿Desea registrar un nuevo producto?', subtitle: 'Agregue un producto al menú.', actionLabel: 'Registrar producto', onAction: fn()}}
    />
  );
}

export const Completa = {render: () => <Demo notice="Se registró el producto Hamburguesa Clásica" />};
export const SinResultados = {render: () => <Demo rows={[]} />};
export const EnCelular = {globals: {viewport: {value: 'mobile2'}}, render: () => <Demo />};
export const FilasPorPagina = {render: () => <PageSizeSelect value={10} onChange={fn()} />};
