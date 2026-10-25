import {fn} from 'storybook/test';
import {ReportTotals} from './components/ReportTotals';
import {SummaryTable} from './components/SummaryTable';
import {SalesTable} from './components/SalesTable';
import {SaleDetailModal} from './components/SaleDetailModal';
import {SchedulesModal} from './components/SchedulesModal';
import {ScheduleFormModal} from './components/ScheduleFormModal';
import {createReportsBackend} from '../../test/reportsBackend';
import {EMPTY_SCHEDULE} from './constants/reports';

export default {title: 'Pantallas/Reportes', parameters: {layout: 'padded'}};

const NOW = Date.now();
const {sales} = createReportsBackend({now: NOW});
const REPORT = {
  tipo: 'detalle',
  resumen: {cantidad: 2, total: 253, efectivo: 100, qr: 153, promedio: 126.5},
  dias: [{fecha: '2026-10-20', ventas: 2, efectivo: 100, qr: 153, total: 253}],
  ventas: sales,
};

const hoursFrom = (hours) => new Date(NOW + hours * 3600000).toISOString();

const SCHEDULES = {
  open: true,
  close: fn(),
  loading: false,
  busy: '',
  items: [
    {id: 1, correo: 'gerencia@brasabrava.bo', tipo: 'resumen', dias: '0100100', hora: '08:00', activo: true, ultimoEnvioEn: hoursFrom(-50), ultimoAtrasado: false, ultimoTurno: hoursFrom(-50), ultimoError: null, proximo: hoursFrom(20)},
    {id: 2, correo: 'contador@estudio.bo', tipo: 'detalle', dias: '1111111', hora: '23:30', activo: true, ultimoEnvioEn: hoursFrom(-1), ultimoAtrasado: true, ultimoTurno: hoursFrom(-11), ultimoError: null, proximo: hoursFrom(13)},
    {id: 3, correo: 'dueno@gmail.com', tipo: 'resumen', dias: '1000000', hora: '21:00', activo: false, ultimoEnvioEn: null, ultimoAtrasado: false, ultimoTurno: null, ultimoError: null, proximo: null},
  ],
  openCreate: fn(),
  openEdit: fn(),
  toggle: fn(),
  sendNow: fn(),
  askRemove: fn(),
};

export const Totales = {render: () => <ReportTotals resumen={REPORT.resumen} />};
export const ResumenPorDia = {render: () => <SummaryTable report={REPORT} />};
export const VentasDetalladas = {render: () => <SalesTable report={REPORT} onOpen={fn()} />};
export const DetalleDeUnaVenta = {render: () => <SaleDetailModal sale={sales[0]} onClose={fn()} onReprint={fn()} />};
export const EnviosProgramados = {render: () => <SchedulesModal schedules={SCHEDULES} />};
export const NuevoEnvioProgramado = {
  render: () => (
    <ScheduleFormModal schedules={{form: {open: true, editing: null, values: EMPTY_SCHEDULE, errors: {}, saving: false}, closeForm: fn(), change: fn(), save: fn()}} />
  ),
};
