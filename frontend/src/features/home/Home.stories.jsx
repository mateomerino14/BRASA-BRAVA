import {DaySummary} from './components/DaySummary';

export default {title: 'Pantallas/Página principal', parameters: {layout: 'padded'}};

const NOW = Date.now();

const SUMMARY = {
  loading: false,
  error: '',
  now: NOW,
  cashier: {cantidad: 12, total: 1845.5, efectivo: 1120, qr: 725.5, mesas: 18, ocupadas: 5, porCobrar: 642},
  kitchen: {preparacion: 3, listos: 2, unidadesPendientes: 11, waiting: {mesa: 'Terraza 2', creadoEn: new Date(NOW - 23 * 60000).toISOString()}},
};

export const Resumen = {render: () => <DaySummary summary={SUMMARY} />};
export const SinPendientesEnCocina = {
  render: () => <DaySummary summary={{...SUMMARY, kitchen: {preparacion: 0, listos: 0, unidadesPendientes: 0, waiting: null}}} />,
};
export const Cargando = {render: () => <DaySummary summary={{...SUMMARY, loading: true}} />};
