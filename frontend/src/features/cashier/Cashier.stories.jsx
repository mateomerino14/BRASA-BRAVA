import {fn} from 'storybook/test';
import {FloorView} from './components/FloorView';
import {CatalogCard} from './components/CatalogCard';
import {OrderPanel} from './components/OrderPanel';
import {ItemPickerModal} from './components/ItemPickerModal';
import {KitchenTicket} from './components/KitchenTicket';
import {ReceiptTicket} from './components/ReceiptTicket';
import {CheckoutModal} from './components/CheckoutModal';
import {TodaySalesModal} from './components/TodaySalesModal';
import {PrintPreview} from '../../components/organisms/PrintPreview';
import {CATALOG} from '../../test/cashierBackend';

export default {title: 'Pantallas/Caja', parameters: {layout: 'padded'}};

const NOW = Date.now();
const minutesAgo = (minutes) => new Date(NOW - minutes * 60000).toISOString();

const table = (id, nombre, venta = null) => ({id, nombre, capacidad: 4, venta});

const SECTION = {
  id: 1,
  nombre: 'Salón principal',
  mesas: [
    table(1, 'Mesa 1'),
    table(2, 'Mesa 2', {id: 7, total: 160, unidades: 5, mesero: 'Carlos Mendoza', abiertaEn: minutesAgo(25)}),
    table(3, 'Mesa 3'),
    table(4, 'Mesa 4', {id: 9, total: 58, unidades: 1, mesero: 'Andrea Romero', abiertaEn: minutesAgo(75)}),
    table(5, 'Mesa 5'),
  ],
};

const FLOOR = {
  sections: [SECTION, {id: 2, nombre: 'Terraza', mesas: []}, {id: 3, nombre: 'Barra', mesas: []}],
  section: SECTION,
  summary: {mesas: 5, ocupadas: 2, libres: 3, porCobrar: 218},
  selectSection: fn(),
  loading: false,
  error: '',
  now: NOW,
};

export const PlanoDeMesas = {render: () => <FloorView floor={FLOOR} onOpenTable={fn()} />};

const [clasica, , gaseosa, cerveza] = CATALOG.productos;

export const TarjetasDelMenu = {
  render: () => (
    <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
      <CatalogCard kind="promocion" item={CATALOG.promociones[0]} onPick={fn()} />
      <CatalogCard kind="producto" item={clasica} onPick={fn()} />
      <CatalogCard kind="producto" item={gaseosa} onPick={fn()} />
      <CatalogCard kind="producto" item={cerveza} onPick={fn()} />
    </div>
  ),
};

const tomate = {idProducto: 11, producto: 'Hamburguesa Clásica', idInsumo: 4, insumo: 'Tomate'};
const mesero = {id: 1, nombre: 'Carlos Mendoza'};

const ORDER = {
  mesa: {id: 2, nombre: 'Mesa 2', capacidad: 4, seccion: {id: 1, nombre: 'Salón principal'}},
  venta: {
    id: 7, numero: 7, total: 140, envios: 2, abiertaEn: minutesAgo(25), cajero: 'a.romero', mesero, modificado: true, modificadoPor: 'admin',
    comandas: [{envio: 1, cajero: 'a.romero', mesero, creadoEn: minutesAgo(25)}, {envio: 2, cajero: 'admin', mesero, creadoEn: minutesAgo(5)}],
    detalles: [
      {id: 1, envio: 1, tipo: 'producto', nombre: 'Hamburguesa Clásica', precioUnitario: 35, cantidad: 1, subtotal: 35, consumo: 'local', mesero, creadoEn: minutesAgo(25), productos: [], exclusiones: [tomate]},
      {id: 2, envio: 1, tipo: 'promocion', nombre: 'Combo Brava', precioUnitario: 70, cantidad: 1, subtotal: 70, consumo: 'local', mesero, creadoEn: minutesAgo(25), productos: [{nombre: 'Doble Brava', cantidad: 1}, {nombre: 'Gaseosa 500 ml', cantidad: 1}], exclusiones: []},
      {id: 3, envio: 2, tipo: 'producto', nombre: 'Hamburguesa Clásica', precioUnitario: 35, cantidad: 1, subtotal: 35, consumo: 'llevar', mesero, creadoEn: minutesAgo(5), productos: [], exclusiones: [tomate]},
    ],
  },
  lines: [
    {key: 'a', tipo: 'producto', id: 11, nombre: 'Hamburguesa Clásica', precio: 35, cantidad: 2, consumo: 'llevar', exclusiones: [tomate]},
    {key: 'b', tipo: 'producto', id: 13, nombre: 'Gaseosa 500 ml', precio: 10, cantidad: 3, consumo: 'local', exclusiones: []},
  ],
  units: 5,
  totals: {registered: 140, pending: 100, total: 240},
  waiters: [{id: 1, nombre: 'Carlos Mendoza', cargo: 'Mesero'}, {id: 2, nombre: 'Andrea Romero', cargo: 'Cajero'}],
  idMesero: '1',
  meseroError: '',
  changeWaiter: fn(),
  changeQuantity: fn(),
  editLine: fn(),
  remove: fn(),
  saving: false,
  submitError: '',
  submit: fn(),
  openPrint: fn(),
};

export const PedidoDeLaMesa = {render: () => <div className="max-w-md"><OrderPanel order={ORDER} /></div>};
export const PedidoNuevoVacio = {render: () => <div className="max-w-md"><OrderPanel order={{...ORDER, venta: null, lines: [], units: 0, totals: {registered: 0, pending: 0, total: 0}, idMesero: ''}} /></div>};

const picker = (kind, item) => ({open: true, session: 1, kind, item, line: null});

export const AgregarProducto = {render: () => <ItemPickerModal picker={picker('producto', clasica)} onConfirm={fn()} onClose={fn()} />};
export const AgregarCombo = {render: () => <ItemPickerModal picker={picker('promocion', CATALOG.promociones[0])} onConfirm={fn()} onClose={fn()} />};

export const ComandaDeCocina = {
  render: () => (
    <PrintPreview open title="Comanda de cocina" description="Envío 2 de Mesa 2: solo lo nuevo de este envío" onClose={fn()}>
      <KitchenTicket mesa={ORDER.mesa} venta={ORDER.venta} envio={2} printedAt={new Date(NOW)} />
    </PrintPreview>
  ),
};

const CHECKOUT = {
  open: true, values: {metodo: 'efectivo', recibido: '150,00', efectivo: ''}, errors: {}, error: '', saving: false, cambio: 10,
  taxLink: 'https://siat.impuestos.gob.bo/v2/launcher/', change: fn(), confirm: fn(), close: fn(),
};

export const Cobro = {render: () => <CheckoutModal checkout={CHECKOUT} venta={ORDER.venta} mesa={ORDER.mesa} />};

const TICKET = {
  numero: 7, mesa: 'Mesa 2', seccion: 'Salón principal', mesero: 'Carlos Mendoza', cajero: 'a.romero', cobrador: 'admin', modificadoPor: 'admin', total: 140,
  lineas: [
    {nombre: 'Hamburguesa Clásica', consumo: 'local', precioUnitario: 35, cantidad: 1, subtotal: 35},
    {nombre: 'Combo Brava', consumo: 'local', precioUnitario: 70, cantidad: 1, subtotal: 70},
    {nombre: 'Hamburguesa Clásica', consumo: 'llevar', precioUnitario: 35, cantidad: 1, subtotal: 35},
  ],
  pagos: [{metodo: 'efectivo', monto: 100}, {metodo: 'qr', monto: 40}], recibido: 100, cambio: 0,
};

export const TicketDeVenta = {
  render: () => (
    <PrintPreview open title="Ticket de venta" description="Mesa 2 quedó libre. Imprima el ticket para el cliente." onClose={fn()}>
      <ReceiptTicket ticket={TICKET} printedAt={new Date(NOW)} />
    </PrintPreview>
  ),
};

const SALES = {
  open: true, close: fn(), loading: false, error: '', hoy: '2026-10-13',
  ventas: [
    {id: 7, numero: 7, mesa: 'Mesa 2', cobrador: 'admin', cerradaEn: minutesAgo(10), total: 140, pagos: TICKET.pagos},
    {id: 6, numero: 6, mesa: 'Terraza 1', cobrador: 'a.romero', cerradaEn: minutesAgo(45), total: 103, pagos: [{metodo: 'qr', monto: 103}]},
  ],
  resumen: {cantidad: 2, total: 243, efectivo: 100, qr: 143},
  receipt: {open: false, ticket: null, printedAt: null}, reprint: fn(), closeReceipt: fn(),
  taxLink: 'https://siat.impuestos.gob.bo/v2/launcher/', linkDraft: null, editLink: fn(), changeLink: fn(), cancelLink: fn(), saveLink: fn(), linkError: '', savingLink: false,
};

export const VentasDeHoy = {render: () => <TodaySalesModal sales={SALES} canEditLink />};
