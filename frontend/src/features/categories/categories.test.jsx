import {describe, expect, it} from 'vitest';
import {screen, waitFor, within} from '@testing-library/react';
import {renderApp} from '../../test/renderApp';
import {mockApi} from '../../test/mockApi';
import {createCategoriesBackend} from '../../test/categoriesBackend';
import {validateCategory} from './utils/categoryForm';

const openPage = async (options) => {
  const backend = createCategoriesBackend(options);
  mockApi(backend.handlers);
  const view = renderApp('/categorias', {token: 't'});
  const table = await screen.findByRole('table', {name: 'Categorías'});
  await within(table).findByText('Hamburguesas');
  return {backend, table, ...view};
};

const pngFile = () => new File([new Uint8Array(64)], 'burger.png', {type: 'image/png'});

describe('Gestión de categorías', () => {
  it('muestra la tabla con foto, subcategorías, estado y acciones', async () => {
    const {table} = await openPage();
    expect(screen.getByRole('heading', {name: 'Gestión de categorías'})).toBeInTheDocument();
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(4);
    expect(within(rows[1]).getByRole('img', {name: 'Hamburguesas'})).toHaveAttribute('src', '/uploads/burger.png');
    expect(within(rows[3]).getByText('Inactiva')).toBeInTheDocument();
    expect(within(rows[3]).getByRole('button', {name: 'Reactivar Combos Especiales'})).toBeInTheDocument();
    expect(screen.getByText('Mostrando 1–3 de 3 categorías')).toBeInTheDocument();
  });

  it('despliega las subcategorías ocultas', async () => {
    const {user} = await openPage();
    const chips = screen.getByRole('list', {name: 'Subcategorías de Hamburguesas'});
    expect(within(chips).queryByText('Picantes')).not.toBeInTheDocument();
    await user.click(within(chips).getByRole('button', {name: '+2 más'}));
    expect(within(chips).getByText('Picantes')).toBeInTheDocument();
    expect(within(chips).getByRole('button', {name: 'Ver menos'})).toHaveAttribute('aria-expanded', 'true');
  });

  it('busca por subcategoría y filtra por estado', async () => {
    const {backend, table, user} = await openPage();
    await user.type(screen.getByRole('searchbox'), 'cerve');
    await waitFor(() => expect(within(table).queryByText('Hamburguesas')).not.toBeInTheDocument());
    expect(backend.calls.list.at(-1)).toMatchObject({search: 'cerve', page: '1'});
    await user.clear(screen.getByRole('searchbox'));
    await user.selectOptions(screen.getByLabelText('Filtrar por estado'), 'inactivos');
    await waitFor(() => expect(within(table).getAllByRole('row')).toHaveLength(2));
  });

  it('valida y registra una categoría con subcategorías y foto', async () => {
    const {backend, user} = await openPage();
    await user.click(screen.getByRole('button', {name: 'Registrar categoría'}));
    const dialog = await screen.findByRole('dialog', {name: 'Registrar nueva categoría'});
    await user.click(within(dialog).getByRole('button', {name: 'Registrar'}));
    expect(within(dialog).getByText('Ingrese el nombre de la categoría (mínimo 2 letras)')).toBeInTheDocument();
    expect(await within(dialog).findByText('Agregue al menos una subcategoría')).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText(/^Nombre/), 'Postres');
    await user.type(within(dialog).getByLabelText(/^Descripción/), 'Dulces de la casa');
    await user.type(within(dialog).getByLabelText(/^Subcategorías/), 'Helados{Enter}Tortas{Enter}');
    await user.upload(within(dialog).getByLabelText('Foto de la categoría', {selector: 'input'}), pngFile());
    await user.click(within(dialog).getByRole('button', {name: 'Registrar'}));

    expect(await screen.findByText('Se registró la categoría Postres')).toBeInTheDocument();
    expect(backend.calls.saved.at(-1)).toEqual({nombre: 'Postres', descripcion: 'Dulces de la casa', subcategorias: [{nombre: 'Helados'}, {nombre: 'Tortas'}]});
    expect(backend.calls.uploads[0]).toMatchObject({id: 99});
    expect(backend.calls.uploads[0].file.name).toBe('burger.png');
  });

  it('muestra el error del servidor por nombre duplicado', async () => {
    const {user} = await openPage();
    await user.click(screen.getByRole('button', {name: 'Registrar categoría'}));
    const dialog = await screen.findByRole('dialog', {name: 'Registrar nueva categoría'});
    await user.type(within(dialog).getByLabelText(/^Nombre/), 'hamburguesas');
    await user.type(within(dialog).getByLabelText(/^Subcategorías/), 'Otra{Enter}');
    await user.click(within(dialog).getByRole('button', {name: 'Registrar'}));
    expect(await within(dialog).findByText('Ya existe una categoría con ese nombre')).toBeInTheDocument();
  });

  it('si falla la foto conserva la categoría y el reintento modifica en vez de duplicar', async () => {
    const {backend, user} = await openPage({failUpload: true});
    await user.click(screen.getByRole('button', {name: 'Registrar categoría'}));
    const dialog = await screen.findByRole('dialog', {name: 'Registrar nueva categoría'});
    await user.type(within(dialog).getByLabelText(/^Nombre/), 'Postres');
    await user.type(within(dialog).getByLabelText(/^Subcategorías/), 'Helados{Enter}');
    await user.upload(within(dialog).getByLabelText('Foto de la categoría', {selector: 'input'}), pngFile());
    await user.click(within(dialog).getByRole('button', {name: 'Registrar'}));
    expect(await within(dialog).findByText(/La categoría se guardó, pero la imagen no/)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', {name: 'Guardar'})).toBeInTheDocument();
    expect(backend.store.filter((category) => category.nombre === 'Postres')).toHaveLength(1);
  });

  it('modifica subcategorías conservando ids y quita la foto', async () => {
    const {backend, user} = await openPage();
    await user.click(screen.getByRole('button', {name: 'Modificar Hamburguesas'}));
    const dialog = await screen.findByRole('dialog', {name: 'Modificar categoría'});
    expect(within(dialog).getByRole('img', {name: 'Vista previa de foto de la categoría'})).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', {name: 'Quitar Picantes'}));
    await user.type(within(dialog).getByLabelText(/^Subcategorías/), 'Pollo{Enter}');
    await user.click(within(dialog).getByRole('button', {name: /Quitar$/}));
    await user.click(within(dialog).getByRole('button', {name: 'Guardar'}));

    expect(await screen.findByText('Se actualizó la categoría Hamburguesas')).toBeInTheDocument();
    const payload = backend.calls.saved.at(-1);
    expect(payload.subcategorias.map((sub) => sub.nombre)).toEqual(['Clásicas', 'Especiales', 'Doble Carne', 'Veggie', 'Pollo']);
    expect(payload.subcategorias[0]).toEqual({id: 1, nombre: 'Clásicas'});
    expect(payload.subcategorias.at(-1).id).toBeUndefined();
    expect(backend.calls.removed).toEqual([1]);
  });

  it('confirma antes de dar de baja una categoría', async () => {
    const {table, user} = await openPage();
    await user.click(within(table).getByRole('button', {name: 'Dar de baja Hamburguesas'}));
    const dialog = await screen.findByRole('dialog', {name: 'Dar de baja categoría'});
    expect(within(dialog).getByText(/dejarán de mostrarse/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', {name: 'Dar de baja'}));
    expect(await screen.findByText('Se dio de baja la categoría Hamburguesas')).toBeInTheDocument();
  });

  it('valida el formulario sin la API', () => {
    expect(validateCategory({nombre: ' ', subcategorias: []})).toEqual({
      nombre: 'Ingrese el nombre de la categoría (mínimo 2 letras)',
      subcategorias: 'Agregue al menos una subcategoría',
    });
    expect(validateCategory({nombre: 'Postres', subcategorias: [{nombre: 'Helados'}]})).toEqual({});
  });
});
