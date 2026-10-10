import {useState} from 'react';
import {Textarea} from './Textarea';
import {Thumbnail} from './Thumbnail';

export default {title: 'Átomos/Imagen y texto largo'};

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
