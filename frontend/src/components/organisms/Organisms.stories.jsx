import {useState} from 'react';
import {fn} from 'storybook/test';
import {Sidebar} from './Sidebar';
import {Header} from './Header';
import {Footer} from './Footer';
import {Modal} from './Modal';
import {EmployeeCarousel} from './EmployeeCarousel';
import {Button} from '../atoms/Button';
import {NAVIGATION, filterNavigation} from '../../config/navigation';

const ALL = [
  'home',
  'familia',
  'caja',
  'productos',
  'secciones',
  'stock',
  'categorias',
  'promociones',
  'empleados',
];
const USERS = [
  {alias: 'a.romero', nombre: 'Andrea Romero'},
  {alias: 'c.mendoza', nombre: 'Carlos Mendoza'},
  {alias: 'admin', nombre: 'Marco Vargas'},
  {alias: 'r.sanchez', nombre: 'Roberto Sánchez'},
  {alias: 'l.flores', nombre: 'Lucía Flores'},
  {alias: 'j.quispe', nombre: 'Juan Quispe'},
  {alias: 'p.rojas', nombre: 'Paola Rojas'},
];

export default {title: 'Organismos'};

function SidebarDemo({permissions}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="h-[640px]">
      <Sidebar
        items={filterNavigation(NAVIGATION, permissions)}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
      />
    </div>
  );
}

export const SidebarAdministrador = {
  parameters: {route: '/stock', layout: 'fullscreen'},
  render: () => <SidebarDemo permissions={ALL} />,
};
export const SidebarCajero = {
  parameters: {layout: 'fullscreen'},
  render: () => <SidebarDemo permissions={['home', 'familia', 'caja']} />,
};
export const Encabezado = {
  parameters: {layout: 'padded'},
  render: () => (
    <Header
      title="Gestión de productos"
      user={{alias: 'admin', nombre: 'Marco Vargas', cargo: 'Administrador'}}
      onLogout={fn()}
    />
  ),
};
export const PieDePagina = {parameters: {layout: 'fullscreen'}, render: () => <Footer />};

function CarouselDemo() {
  const [selected, setSelected] = useState('admin');
  return (
    <EmployeeCarousel
      users={USERS}
      selectedAlias={selected}
      onSelect={(user) => setSelected(user.alias)}
    />
  );
}

export const CarruselDeEmpleados = {
  parameters: {layout: 'padded'},
  render: () => <CarouselDemo />,
};
export const CarruselCargando = {
  parameters: {layout: 'padded'},
  render: () => <EmployeeCarousel users={[]} loading onSelect={fn()} />,
};

function ModalDemo() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Abrir modal</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Recuperar contraseña"
        description="Ingrese el correo asociado a su cuenta de empleado."
      >
        <div className="flex flex-col gap-3">
          <Button fullWidth>Enviar código</Button>
          <Button fullWidth variant="danger" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
        </div>
      </Modal>
    </>
  );
}

export const VentanaModal = {render: () => <ModalDemo />};
