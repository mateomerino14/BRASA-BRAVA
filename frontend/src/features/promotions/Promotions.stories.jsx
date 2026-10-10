import {fn} from 'storybook/test';
import {PromotionsTable} from './components/PromotionsTable';
import {fakeList} from '../../stories/fakeList';
import {PROMOTIONS} from '../../test/promotionsBackend';

export default {title: 'Pantallas/Promociones', parameters: {layout: 'padded'}};

const Table = () => <PromotionsTable list={fakeList({items: PROMOTIONS})} onEdit={fn()} onToggleStatus={fn()} />;

export const Tabla = {render: () => <Table />};
export const EnCelular = {globals: {viewport: {value: 'mobile2'}}, render: () => <Table />};
