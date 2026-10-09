import {Input} from './Input';
import {PasswordInput} from './PasswordInput';

export default {
  title: 'Átomos/Input',
  component: Input,
  args: {placeholder: 'Su alias de empleado', 'aria-label': 'Usuario'},
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export const Normal = {};
export const ConError = {args: {invalid: true, defaultValue: 'usuario-incorrecto'}};
export const Deshabilitado = {args: {disabled: true, defaultValue: 'DIRECTORIO'}};
export const Contrasena = {
  render: () => <PasswordInput aria-label="Contraseña" defaultValue="Brasa2026" />,
};
