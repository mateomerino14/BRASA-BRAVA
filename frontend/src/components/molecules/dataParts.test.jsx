import {describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Boxes, Scale} from 'lucide-react';
import {SegmentedControl} from './SegmentedControl';
import {StatCard} from './StatCard';
import {Stepper} from './Stepper';
import {ChipList} from './ChipList';
import {Amount} from '../atoms/Amount';
import {NumberInput} from '../atoms/NumberInput';
import {levelRatio} from '../../lib/level';
import {formatQuantity, quantityParts} from '../../lib/format';

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
