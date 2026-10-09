import {fn} from 'storybook/test';
import {LogIn} from 'lucide-react';
import {Button} from './Button';

export default {
  title: 'Átomos/Button',
  component: Button,
  args: {children: 'Ingresar', onClick: fn()},
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['primary', 'dark', 'danger', 'outline', 'ghost'],
    },
    size: {control: 'inline-radio', options: ['sm', 'md', 'lg']},
  },
};

export const Primario = {args: {variant: 'primary', children: 'Modo directorio'}};
export const Oscuro = {args: {variant: 'dark'}};
export const Peligro = {args: {variant: 'danger', children: 'Cancelar'}};
export const Contorno = {args: {variant: 'outline', children: 'Reenviar código'}};
export const ConIcono = {args: {icon: <LogIn size={18} />}};
export const Cargando = {args: {loading: true, children: 'Verificando'}};
export const Variantes = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button>Primario</Button>
      <Button variant="dark">Oscuro</Button>
      <Button variant="danger">Peligro</Button>
      <Button variant="outline">Contorno</Button>
      <Button variant="ghost">Fantasma</Button>
    </div>
  ),
};
