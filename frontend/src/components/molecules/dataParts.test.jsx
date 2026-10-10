import {describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Boxes, Scale} from 'lucide-react';
import {SegmentedControl} from './SegmentedControl';
import {StatCard} from './StatCard';
import {Stepper} from './Stepper';
import {ChipList} from './ChipList';
import {DayPicker} from './DayPicker';
import {PriceTag} from './PriceTag';
import {ChipTabs} from './ChipTabs';
import {Amount} from '../atoms/Amount';
import {NumberInput} from '../atoms/NumberInput';
import {levelRatio} from '../../lib/level';
import {formatDate, formatDays, formatQuantity, formatTime, normalizeText, quantityParts} from '../../lib/format';

describe('Piezas de stock', () => {
  it('SegmentedControl funciona como grupo de radios', async () => {
    const onChange = vi.fn();
    render(<SegmentedControl label="Tipo" value="a" onChange={onChange} options={[{value: 'a', label: 'Entrada'}, {value: 'b', label: 'Ajuste', icon: Scale}]} />);
    expect(screen.getByRole('radio', {name: 'Entrada'})).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(screen.getByRole('radio', {name: 'Ajuste'}));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('StatCard es un filtro presionable solo si recibe onClick', async () => {
    const onClick = vi.fn();
    const {rerender} = render(<StatCard icon={Boxes} label="Sin stock" value={2} active onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', {name: /2\s*Sin stock/}));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    rerender(<StatCard icon={Boxes} label="Sin stock" value={2} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('Amount y NumberInput muestran prefijo o unidad aparte', () => {
    render(<><Amount prefix="Bs" value="35,00" /><NumberInput aria-label="Cantidad" suffix="kg" /></>);
    expect(screen.getByLabelText('Bs 35,00')).toBeInTheDocument();
    expect(screen.getByLabelText('Cantidad')).toHaveAttribute('inputmode', 'decimal');
    expect(screen.getByText('kg')).toBeInTheDocument();
  });

  it('formatea cantidades y calcula el nivel de la barra', () => {
    expect(formatQuantity(1.5, 'kg')).toBe('1,5 kg');
    expect(formatQuantity(1, 'unidad')).toBe('1 unidad');
    expect(formatQuantity(40, 'unidad')).toBe('40 unidades');
    expect(quantityParts(2.25, 'l')).toEqual({amount: '2,25', unit: 'L'});
    expect(levelRatio(0, 5)).toBe(0);
    expect(levelRatio(5, 5)).toBeCloseTo(1 / 3);
    expect(levelRatio(100, 5)).toBe(1);
    expect(levelRatio(3, 0)).toBe(1);
  });
});

describe('Stepper y ChipList', () => {
  it('Stepper suma, resta y respeta el rango', async () => {
    const onChange = vi.fn();
    const {rerender} = render(<Stepper label="Capacidad" value={1} min={1} max={3} onChange={onChange} />);
    expect(screen.getByRole('button', {name: 'Restar capacidad'})).toBeDisabled();
    await userEvent.click(screen.getByRole('button', {name: 'Sumar capacidad'}));
    expect(onChange).toHaveBeenLastCalledWith(2);
    rerender(<Stepper label="Capacidad" value={3} min={1} max={3} onChange={onChange} />);
    expect(screen.getByRole('button', {name: 'Sumar capacidad'})).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Capacidad'), '9');
    expect(onChange).toHaveBeenLastCalledWith(3);
  });

  it('ChipList despliega los chips ocultos', async () => {
    render(<ChipList label="Mesas" visible={1} items={[{id: 1, label: 'M1'}, {id: 2, label: 'M2'}]} />);
    expect(screen.queryByText('M2')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', {name: '+1 más'}));
    expect(screen.getByText('M2')).toBeInTheDocument();
  });
});

describe('DayPicker y PriceTag', () => {
  it('DayPicker enciende y apaga días y ofrece volver a todos', async () => {
    const onChange = vi.fn();
    const {rerender} = render(<DayPicker value="1111111" onChange={onChange} />);
    expect(screen.queryByRole('button', {name: 'Todos los días'})).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', {name: 'Domingo'}));
    expect(onChange).toHaveBeenLastCalledWith('0111111');
    rerender(<DayPicker value="0010000" onChange={onChange} />);
    expect(screen.getByRole('button', {name: 'Martes'})).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', {name: 'Todos los días'}));
    expect(onChange).toHaveBeenLastCalledWith('1111111');
  });

  it('PriceTag muestra el regular tachado y el ahorro', () => {
    render(<PriceTag regular={83} promo={70} />);
    expect(screen.getByLabelText('Precio regular Bs 83,00')).toHaveClass('line-through');
    expect(screen.getByText('−16%')).toBeInTheDocument();
  });

  it('formatea fechas y días de promociones', () => {
    expect(formatDate('2026-10-03')).toBe('3 oct 2026');
    expect(formatDays('1111111')).toBe('Todos los días');
    expect(formatDays('0111110')).toBe('Lun a vie');
    expect(formatDays('1000001')).toBe('Fines de semana');
    expect(formatDays('0010000')).toBe('Martes');
    expect(formatDays('0010100')).toBe('Mar, Jue');
  });
});

describe('ChipTabs', () => {
  it('marca la opción elegida, avisa el cambio y lee el contador con su texto', async () => {
    const onChange = vi.fn();
    const options = [{value: '1', label: 'Salón', count: 2, countLabel: '2 mesas ocupadas'}, {value: '2', label: 'Terraza'}];
    render(<ChipTabs label="Secciones" options={options} value="1" onChange={onChange} />);
    expect(screen.getByRole('radio', {name: 'Salón, 2 mesas ocupadas'})).toBeChecked();
    await userEvent.click(screen.getByRole('radio', {name: 'Terraza'}));
    expect(onChange).toHaveBeenCalledWith('2');
  });
});

describe('formato de hora y búsqueda', () => {
  it('muestra la hora en 24 horas y compara textos sin tildes', () => {
    expect(formatTime(new Date(2026, 9, 13, 20, 5))).toBe('20:05');
    expect(normalizeText('Clásica ÑANDÚ')).toBe('clasica nandu');
  });
});
