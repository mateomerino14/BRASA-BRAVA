import {useState} from 'react';
import {CodeInput} from './CodeInput';
import {FormField} from './FormField';
import {Alert} from './Alert';
import {LiveClock} from './LiveClock';
import {Toast} from './Toast';
import {Button} from '../atoms/Button';
import {useToast} from '../../context/useToast';
import {Input} from '../atoms/Input';

export default {title: 'Moléculas'};

function CodeDemo({invalid}) {
  const [value, setValue] = useState(() => {
    if (invalid) {
      return '123456';
    }
    return '';
  });
  return <CodeInput value={value} onChange={setValue} invalid={invalid} />;
}

export const CodigoDeVerificacion = {render: () => <CodeDemo />};
export const CodigoConError = {render: () => <CodeDemo invalid />};
export const CampoDeFormulario = {
  render: () => (
    <div className="flex w-96 flex-col gap-4">
      <FormField label="Correo" hint="El asociado a su cuenta de empleado.">
        {(field) => <Input {...field} placeholder="nombre@brasabrava.bo" />}
      </FormField>
      <FormField label="Usuario" required error="Ingrese su usuario">
        {(field) => <Input {...field} />}
      </FormField>
    </div>
  ),
};
export const Avisos = {
  render: () => (
    <div className="flex w-96 flex-col gap-3">
      <Alert tone="info">Le enviamos un código de 6 dígitos.</Alert>
      <Alert tone="success">Contraseña actualizada correctamente.</Alert>
      <Alert tone="error">Código incorrecto. Le quedan 4 intento(s).</Alert>
    </div>
  ),
};
export const Reloj = {render: () => <LiveClock />};

export const AvisosEmergentes = {
  render: () => (
    <div className="flex w-[28rem] flex-col gap-3">
      <Toast tone="error" title="No se pudo ingresar" message="Usuario o contraseña incorrectos" onClose={() => {}} />
      <Toast tone="success" message="Se guardaron los cambios" onClose={() => {}} />
    </div>
  ),
};

function ToastDemo() {
  const toast = useToast();
  return (
    <div className="flex gap-3">
      <Button variant="danger" onClick={() => toast.error('Código incorrecto. Le quedan 4 intento(s)')}>Mostrar error</Button>
      <Button onClick={() => toast.success('Se guardaron los cambios')}>Mostrar éxito</Button>
    </div>
  );
}

export const AvisosEmergentesEnVivo = {render: () => <ToastDemo />};
