import {useState} from 'react';
import {ImagePicker} from './ImagePicker';
import {TagInput} from './TagInput';

export default {title: 'Moléculas/Imágenes y etiquetas'};

function PickerDemo({url}) {
  const [file, setFile] = useState(null);
  const [current, setCurrent] = useState(url);
  const change = (selected) => {
    setFile(selected);
    if (!selected) {
      setCurrent(null);
    }
  };
  return (
    <div className="w-72">
      <ImagePicker label="Foto de la categoría" file={file} url={current} onChange={change} />
    </div>
  );
}

function TagsDemo() {
  const [tags, setTags] = useState(['Clásicas', 'Especiales', 'Doble Carne'].map((label) => ({key: label, label})));
  return (
    <div className="w-[28rem]">
      <TagInput
        tags={tags}
        max={20}
        onAdd={(label) => setTags((current) => [...current, {key: label, label}])}
        onRemove={(key) => setTags((current) => current.filter((tag) => tag.key !== key))}
      />
    </div>
  );
}

export const SelectorDeImagenVacio = {render: () => <PickerDemo url={null} />};
export const SelectorConImagen = {render: () => <PickerDemo url="/favicon.png" />};
export const Etiquetas = {render: () => <TagsDemo />};
