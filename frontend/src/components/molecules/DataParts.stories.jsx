import {useState} from 'react';
import {fn} from 'storybook/test';
import {AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Boxes, PackageX, Scale} from 'lucide-react';
import {SegmentedControl} from './SegmentedControl';
import {StatCard} from './StatCard';
import {Stepper} from './Stepper';
import {ChipList} from './ChipList';
import {DayPicker} from './DayPicker';
import {PriceTag} from './PriceTag';
import {ChipTabs} from './ChipTabs';
import {Amount} from '../atoms/Amount';
import {LevelBar} from '../atoms/LevelBar';
import {NumberInput} from '../atoms/NumberInput';

export default {title: 'Moléculas/Resumen y cantidades'};

function SegmentDemo() {
  const [value, setValue] = useState('entrada');
  const options = [
    {value: 'entrada', label: 'Entrada', icon: ArrowDownToLine},
    {value: 'salida', label: 'Salida', icon: ArrowUpFromLine},
    {value: 'ajuste', label: 'Ajuste', icon: Scale},
  ];
  return <div className="w-96"><SegmentedControl label="Tipo de movimiento" options={options} value={value} onChange={setValue} /></div>;
}

export const SelectorSegmentado = {render: () => <SegmentDemo />};

export const TarjetasDeResumen = {
  parameters: {layout: 'padded'},
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <StatCard icon={Boxes} label="Insumos activos" value={12} active onClick={fn()} />
      <StatCard icon={AlertTriangle} tone="warning" label="Con stock bajo" value={1} onClick={fn()} />
      <StatCard icon={PackageX} tone="danger" label="Sin stock" value={2} onClick={fn()} />
    </div>
  ),
};

export const MontosYNiveles = {
  render: () => (
    <div className="flex w-72 flex-col gap-4">
      <Amount prefix="Bs" value="35,00" />
      <div className="flex flex-col gap-1.5"><Amount value="12" suffix="kg" /><LevelBar value={12} minimum={5} /></div>
      <div className="flex flex-col gap-1.5"><Amount value="1,5" suffix="kg" /><LevelBar value={1.5} minimum={2} tone="warning" /></div>
      <div className="flex flex-col gap-1.5"><Amount value="0" suffix="unidades" /><LevelBar value={0} minimum={5} tone="danger" /></div>
      <NumberInput aria-label="Cantidad" suffix="kg" defaultValue="3,5" />
    </div>
  ),
};

function StepperDemo() {
  const [value, setValue] = useState(4);
  return <Stepper label="Capacidad" value={value} min={1} max={30} onChange={setValue} />;
}

export const ContadorConBotones = {render: () => <StepperDemo />};
export const ChipsDesplegables = {
  render: () => <ChipList label="Mesas del salón" visible={4} items={Array.from({length: 10}, (_, index) => ({id: index, label: `Mesa ${index + 1} · 4`}))} />,
};

function DaysDemo() {
  const [value, setValue] = useState('0010000');
  return <DayPicker value={value} onChange={setValue} />;
}

export const DiasDeLaSemana = {render: () => <DaysDemo />};
export const PrecioConPromocion = {render: () => <PriceTag regular={83} promo={70} size="lg" />};

function ChipTabsDemo() {
  const [value, setValue] = useState('1');
  const options = [
    {value: '1', label: 'Salón principal', count: 2, countLabel: '2 mesas ocupadas'},
    {value: '2', label: 'Terraza', count: 1, countLabel: '1 mesa ocupada'},
    {value: '3', label: 'Barra'},
    {value: '4', label: 'Patio trasero'},
  ];
  return <div className="w-96"><ChipTabs label="Secciones" options={options} value={value} onChange={setValue} /></div>;
}

export const PestanasDesplazables = {render: () => <ChipTabsDemo />};
