import {fn} from 'storybook/test';
import {ShipmentCard} from './components/ShipmentCard';

export default {title: 'Pantallas/Cocina', parameters: {layout: 'padded'}};

const NOW = Date.now();
const minutesAgo = (minutes) => new Date(NOW - minutes * 60000).toISOString();

const line = (id, nombre, cantidad, listos, extra = {}) => ({id, tipo: 'producto', nombre, cantidad, listos, consumo: 'local', productos: [], exclusiones: [], ...extra});

const shipment = (minutes, lineas, extra = {}) => {
  const unidades = lineas.reduce((total, item) => total + item.cantidad, 0);
  const listas = lineas.reduce((total, item) => total + item.listos, 0);
  return {
    id: `s-${minutes}`, idVenta: 1, numero: 7, envio: 1, modificadoPor: null, mesa: 'Mesa 2', seccion: 'Salón principal', mesero: 'Carlos Mendoza',
    creadoEn: minutesAgo(minutes), unidades, listas, estado: listas === unidades ? 'listo' : 'preparacion', lineas, ...extra,
  };
};

const LINES = [
  line(1, 'Hamburguesa Clásica', 2, 1, {exclusiones: [{producto: 'Hamburguesa Clásica', insumo: 'Tomate'}]}),
  line(2, 'Combo Brava', 1, 0, {tipo: 'promocion', productos: [{nombre: 'Doble Brava', cantidad: 1}, {nombre: 'Gaseosa 500 ml', cantidad: 1}]}),
  line(3, 'Papas Fritas Clásicas', 2, 2, {consumo: 'llevar'}),
];

const Card = ({value}) => <div className="max-w-md"><ShipmentCard shipment={value} now={NOW} busy="" onMarkLine={fn()} onMarkShipment={fn()} /></div>;

export const RecienLlegado = {render: () => <Card value={shipment(4, LINES)} />};
export const EsperandoMucho = {render: () => <Card value={shipment(26, LINES, {envio: 2, modificadoPor: 'a.romero'})} />};
export const Listo = {render: () => <Card value={shipment(12, LINES.map((item) => ({...item, listos: item.cantidad})))} />};
