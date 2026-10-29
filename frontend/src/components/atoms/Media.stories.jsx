import {useState} from 'react';
import {Textarea} from './Textarea';
import {Thumbnail} from './Thumbnail';
import {Switch} from './Switch';
import {MoneyInput} from './MoneyInput';

export default {title: 'Átomos/Imagen, texto largo y montos'};

function TextareaDemo() {
  const [value, setValue] = useState('Hamburguesas a la parrilla con pan artesanal');
  return <Textarea aria-label="Descripción" maxLength={160} value={value} onChange={(event) => setValue(event.target.value)} />;
}

export const AreaDeTexto = {
  render: () => (
    <div className="w-96">
      <TextareaDemo />
    </div>
  ),
};

export const Miniaturas = {
  render: () => (
    <div className="flex items-end gap-4">
      <Thumbnail src="/favicon.png" alt="Con foto" size={64} />
      <Thumbnail src="/favicon.png" alt="Inactiva" size={64} muted />
      <Thumbnail alt="Sin foto" size={64} />
      <Thumbnail alt="Pequeña" size={36} />
    </div>
  ),
};

function SwitchDemo() {
  const [checked, setChecked] = useState(true);
  return <Switch label="Disponible" checked={checked} onChange={setChecked} onText="Disponible" offText="Agotado" />;
}

export const Interruptor = {render: () => <SwitchDemo />};
export const InterruptorDeshabilitado = {render: () => <Switch label="Disponible" checked={false} onChange={() => {}} disabled offText="Agotado" />};
export const CampoDePrecio = {render: () => <div className="w-60"><MoneyInput aria-label="Precio" defaultValue="35,50" /></div>};
