import {useState} from 'react';
import {describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {ImagePicker} from './ImagePicker';
import {TagInput} from './TagInput';
import {Textarea} from '../atoms/Textarea';
import {Thumbnail} from '../atoms/Thumbnail';
import {Switch} from '../atoms/Switch';
import {MoneyInput} from '../atoms/MoneyInput';

const pngFile = (name = 'foto.png', size = 1024) => new File([new Uint8Array(size)], name, {type: 'image/png'});

function TagDemo({initial = [], max}) {
  const [tags, setTags] = useState(initial.map((label) => ({key: label, label})));
  return (
    <TagInput
      aria-describedby="x"
      tags={tags}
      max={max}
      onAdd={(label) => setTags((current) => [...current, {key: label, label}])}
      onRemove={(key) => setTags((current) => current.filter((tag) => tag.key !== key))}
    />
  );
}

describe('Textarea', () => {
  it('muestra el contador de caracteres y lo resalta al llegar al máximo', () => {
    const {rerender} = render(<Textarea aria-label="Descripción" maxLength={10} value="Hola" onChange={() => {}} />);
    expect(screen.getByText('4/10')).toBeInTheDocument();
    rerender(<Textarea aria-label="Descripción" maxLength={10} value="0123456789" onChange={() => {}} />);
    expect(screen.getByText('10/10')).toHaveClass('text-rojo');
  });
});

describe('Thumbnail', () => {
  it('muestra la foto o un marcador sin imagen', () => {
    const {rerender} = render(<Thumbnail src="/uploads/a.png" alt="Hamburguesas" />);
    expect(screen.getByRole('img', {name: 'Hamburguesas'})).toHaveAttribute('src', '/uploads/a.png');
    rerender(<Thumbnail alt="Bebidas" />);
    expect(screen.getByRole('img', {name: 'Bebidas (sin imagen)'})).toBeInTheDocument();
  });
});

describe('ImagePicker', () => {
  it('acepta una imagen válida y muestra la vista previa con acciones', async () => {
    const onChange = vi.fn();
    const {rerender} = render(<ImagePicker label="Foto" onChange={onChange} />);
    const file = pngFile();
    await userEvent.upload(screen.getByLabelText('Foto'), file);
    expect(onChange).toHaveBeenCalledWith(file);
    rerender(<ImagePicker label="Foto" file={file} onChange={onChange} />);
    expect(screen.getByRole('img', {name: 'Vista previa de foto'})).toHaveAttribute('src', expect.stringMatching(/^blob:/));
    await userEvent.click(screen.getByRole('button', {name: /Quitar/}));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('rechaza formatos no admitidos y archivos pesados', async () => {
    const onChange = vi.fn();
    render(<ImagePicker label="Foto" maxMb={1} onChange={onChange} />);
    const input = screen.getByLabelText('Foto');
    fireEvent.change(input, {target: {files: [new File(['x'], 'doc.pdf', {type: 'application/pdf'})]}});
    expect(screen.getByRole('alert')).toHaveTextContent('La imagen debe ser PNG, JPG o WEBP');
    fireEvent.change(input, {target: {files: [pngFile('grande.png', 2 * 1024 * 1024)]}});
    expect(screen.getByRole('alert')).toHaveTextContent('La imagen no puede pesar más de 1 MB');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('recibe una imagen arrastrada', () => {
    const onChange = vi.fn();
    render(<ImagePicker label="Foto" onChange={onChange} />);
    const file = pngFile();
    fireEvent.drop(screen.getByText(/Arrastre una foto/).closest('label'), {dataTransfer: {files: [file]}});
    expect(onChange).toHaveBeenCalledWith(file);
  });
});

describe('TagInput', () => {
  it('agrega con Enter o coma y quita con el botón o Retroceso', async () => {
    render(<TagDemo initial={['Clásicas']} />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'Especiales{Enter}Veggie,');
    expect(screen.getByText('Especiales')).toBeInTheDocument();
    expect(screen.getByText('Veggie')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', {name: 'Quitar Clásicas'}));
    await waitFor(() => expect(screen.queryByText('Clásicas')).not.toBeInTheDocument());
    await userEvent.type(input, '{Backspace}');
    await waitFor(() => expect(screen.queryByText('Veggie')).not.toBeInTheDocument());
  });

  it('avisa repetidos y respeta el máximo', async () => {
    render(<TagDemo initial={['Jugos']} max={2} />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'jugos{Enter}');
    expect(screen.getByRole('alert')).toHaveTextContent('"jugos" ya está en la lista');
    await userEvent.clear(input);
    await userEvent.type(input, 'Gaseosas{Enter}Cervezas{Enter}');
    expect(screen.getByRole('alert')).toHaveTextContent('Máximo 2 elementos');
    expect(screen.getByText('2/2')).toBeInTheDocument();
  });
});

describe('Switch y MoneyInput', () => {
  it('el interruptor informa su estado y respeta deshabilitado', async () => {
    const onChange = vi.fn();
    const {rerender} = render(<Switch label="Disponible" checked onChange={onChange} onText="Sí" offText="No" />);
    const toggle = screen.getByRole('switch', {name: 'Disponible'});
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith(false);
    rerender(<Switch label="Disponible" checked={false} onChange={onChange} disabled onText="Sí" offText="No" />);
    await userEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('el campo de precio abre el teclado decimal', () => {
    render(<MoneyInput aria-label="Precio" defaultValue="35,50" />);
    expect(screen.getByLabelText('Precio')).toHaveAttribute('inputmode', 'decimal');
    expect(screen.getByText('Bs')).toBeInTheDocument();
  });
});
