import {useState} from 'react';
import {describe, expect, it} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {CodeInput} from './CodeInput';
import {FormField} from './FormField';
import {Input} from '../atoms/Input';

function ControlledCode() {
  const [value, setValue] = useState('');
  return (
    <>
      <CodeInput value={value} onChange={setValue} />
      <output data-testid="value">{value}</output>
    </>
  );
}

describe('CodeInput', () => {
  it('avanza de casilla al escribir', async () => {
    render(<ControlledCode />);
    await userEvent.click(screen.getByLabelText('Dígito 1'));
    await userEvent.keyboard('123');
    expect(screen.getByTestId('value')).toHaveTextContent('123');
    expect(screen.getByLabelText('Dígito 4')).toHaveFocus();
  });

  it('acepta pegar el código completo e ignora letras', async () => {
    render(<ControlledCode />);
    await userEvent.click(screen.getByLabelText('Dígito 1'));
    await userEvent.paste('12-34a56');
    expect(screen.getByTestId('value')).toHaveTextContent('123456');
  });

  it('borrar en una casilla vacía retrocede', async () => {
    render(<ControlledCode />);
    await userEvent.click(screen.getByLabelText('Dígito 1'));
    await userEvent.keyboard('12{Backspace}{Backspace}');
    expect(screen.getByTestId('value')).toHaveTextContent('');
    expect(screen.getByLabelText('Dígito 1')).toHaveFocus();
  });

  it('borrar un dígito del medio no corre los siguientes', async () => {
    render(<ControlledCode />);
    await userEvent.click(screen.getByLabelText('Dígito 1'));
    await userEvent.paste('123456');
    await userEvent.click(screen.getByLabelText('Dígito 3'));
    await userEvent.keyboard('{Backspace}');
    expect(screen.getByLabelText('Dígito 4')).toHaveValue('4');
    expect(screen.getByLabelText('Dígito 3')).toHaveValue('');
  });
});

describe('FormField', () => {
  it('asocia la etiqueta y el error al control', () => {
    render(
      <FormField label="Usuario" error="Ingrese su usuario">
        {(field) => <Input {...field} />}
      </FormField>,
    );
    const input = screen.getByLabelText('Usuario');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Ingrese su usuario');
    expect(screen.getByRole('alert')).toHaveTextContent('Ingrese su usuario');
  });
});
