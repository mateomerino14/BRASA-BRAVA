import {describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Button} from './Button';
import {PasswordInput} from './PasswordInput';
import {Avatar} from './Avatar';
import {Badge} from './Badge';
import {TimeInput} from './TimeInput';

describe('Button', () => {
  it('ejecuta onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Ingresar</Button>);
    await userEvent.click(screen.getByRole('button', {name: 'Ingresar'}));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('en carga se deshabilita y muestra el indicador', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Guardar
      </Button>,
    );
    const button = screen.getByRole('button', {name: /Guardar/});
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status', {name: 'Procesando'})).toBeInTheDocument();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('aplica la variante de color', () => {
    render(<Button variant="danger">Cancelar</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-rojo');
  });
});

describe('PasswordInput', () => {
  it('muestra y oculta la contraseña con el ojo', async () => {
    render(<PasswordInput aria-label="Contraseña" defaultValue="secreta" />);
    const input = screen.getByLabelText('Contraseña');
    expect(input).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', {name: 'Mostrar contraseña'}));
    expect(input).toHaveAttribute('type', 'text');
    await userEvent.click(screen.getByRole('button', {name: 'Ocultar contraseña'}));
    expect(input).toHaveAttribute('type', 'password');
  });
});

describe('Avatar', () => {
  it('muestra iniciales cuando no hay foto', () => {
    render(<Avatar name="Andrea Romero" />);
    expect(screen.getByRole('img', {name: 'Andrea Romero'})).toHaveTextContent('AR');
  });

  it('muestra la foto si existe', () => {
    render(<Avatar name="Andrea" src="/foto.png" />);
    expect(screen.getByRole('img', {name: 'Andrea'})).toHaveAttribute('src', '/foto.png');
  });
});

describe('Badge', () => {
  it('renderiza el texto con el tono indicado', () => {
    render(<Badge tone="success">Activo</Badge>);
    expect(screen.getByText('Activo')).toHaveClass('text-verde');
  });
});

describe('TimeInput', () => {
  it('elige la hora en 12 horas con AM/PM y guarda HH:MM de 24 horas', async () => {
    const onChange = vi.fn();
    const {rerender} = render(<TimeInput label="Hora de inicio" value="" onChange={onChange} />);
    expect(screen.getByRole('combobox', {name: 'Hora de inicio: minutos'})).toBeDisabled();
    await userEvent.selectOptions(screen.getByRole('combobox', {name: 'Hora de inicio: hora'}), '6');
    expect(onChange).toHaveBeenLastCalledWith('18:00');
    rerender(<TimeInput label="Hora de inicio" value="18:00" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', {name: 'AM'}));
    expect(onChange).toHaveBeenLastCalledWith('06:00');
    rerender(<TimeInput label="Hora de inicio" value="00:30" onChange={onChange} />);
    expect(screen.getByRole('combobox', {name: 'Hora de inicio: hora'})).toHaveValue('12');
    expect(screen.getByRole('button', {name: 'AM'})).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', {name: 'Quitar hora de inicio'}));
    expect(onChange).toHaveBeenLastCalledWith('');
  });
});
