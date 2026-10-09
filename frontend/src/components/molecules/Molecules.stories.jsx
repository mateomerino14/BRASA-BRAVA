import {useState} from 'react';
import {CodeInput} from './CodeInput';
import {FormField} from './FormField';
import {Alert} from './Alert';
import {LiveClock} from './LiveClock';
import {Input} from '../atoms/Input';

export default {title: 'Moléculas'};

function CodeDemo({invalid}) {
  const [value, setValue] = useState(invalid ? '123456' : '');
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
