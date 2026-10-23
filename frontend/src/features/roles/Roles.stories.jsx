import {fn} from 'storybook/test';
import {RolesTable} from './components/RolesTable';
import {fakeList} from '../../stories/fakeList';
import {ROLES} from '../../test/rolesBackend';

export default {title: 'Pantallas/Cargos', parameters: {layout: 'padded'}};

const Table = () => <RolesTable list={fakeList({items: ROLES})} onEdit={fn()} onToggleStatus={fn()} />;

export const Tabla = {render: () => <Table />};
export const EnCelular = {globals: {viewport: {value: 'mobile2'}}, render: () => <Table />};
