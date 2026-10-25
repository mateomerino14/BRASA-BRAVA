import {CheckCircle2, Clock, Mail, Pencil, Send, Trash2} from 'lucide-react';
import {Button} from '../../../components/atoms/Button';
import {IconButton} from '../../../components/atoms/IconButton';
import {Spinner} from '../../../components/atoms/Spinner';
import {Switch} from '../../../components/atoms/Switch';
import {Modal} from '../../../components/organisms/Modal';
import {cn} from '../../../lib/cn';
import {formatClock, formatDayMonthYear, formatTime} from '../../../lib/format';
import {REPORT_TITLES} from '../constants/reports';
import {daysText, isoDate} from '../utils/reports';

const styles = {
  list: 'flex flex-col gap-3',
  item: 'flex flex-col gap-3 rounded-2xl border border-arena/50 bg-white p-4 sm:flex-row sm:items-center',
  icon: 'flex size-11 shrink-0 items-center justify-center rounded-xl bg-brasa/10 text-brasa-oscuro',
  text: 'min-w-0 flex-1',
  mail: 'truncate font-semibold text-carbon',
  plan: 'text-sm text-cafe',
  status: 'mt-1 flex items-center gap-1 text-xs text-cafe',
  late: 'text-brasa-oscuro',
  failed: 'text-rojo',
  tools: 'flex shrink-0 items-center gap-2',
  empty: 'rounded-2xl border border-dashed border-arena bg-white px-4 py-8 text-center text-sm text-cafe',
  loading: 'flex justify-center py-8',
  actions: 'grid gap-3 sm:grid-cols-2',
};

const when = (date) => `${formatDayMonthYear(isoDate(new Date(date)))} ${formatTime(date)}`;

// Último envío, si salió al encender el sistema o si falló, y el próximo
const statusOf = (item) => {
  let next = 'pausado';
  if (item.proximo) {
    next = `próximo: ${when(item.proximo)}`;
  }
  if (item.ultimoError) {
    return {tone: 'failed', Icon: Clock, text: `No se pudo enviar (${item.ultimoError}); se reintenta solo · ${next}`};
  }
  if (!item.ultimoEnvioEn) {
    return {tone: '', Icon: Clock, text: `Todavía no se envió · ${next}`};
  }
  if (item.ultimoAtrasado) {
    return {tone: 'late', Icon: Clock, text: `Enviado al encender: ${when(item.ultimoEnvioEn)} (tocaba ${when(item.ultimoTurno)}) · ${next}`};
  }
  return {tone: '', Icon: CheckCircle2, text: `Enviado el ${when(item.ultimoEnvioEn)} · ${next}`};
};

// Envíos programados del reporte de ventas (solo el DIRECTORIO)
export function SchedulesModal({schedules}) {
  return (
    <Modal
      open={schedules.open}
      onClose={schedules.close}
      title="Envíos programados"
      description="Cada envío trae las ventas desde el envío anterior. Si la computadora estaba apagada a esa hora, se envía apenas se encienda."
      size="lg"
      footer={(
        <div className={styles.actions}>
          <Button variant="outline" action="close" onClick={schedules.close}>Cerrar</Button>
          <Button action="add" onClick={schedules.openCreate}>Nuevo envío</Button>
        </div>
      )}
    >
      {schedules.loading && <div className={styles.loading}><Spinner size={28} label="Cargando envíos" /></div>}
      {!schedules.loading && schedules.items.length === 0 && (
        <p className={styles.empty}>No hay envíos programados. Use Nuevo envío para que el reporte llegue solo a un correo.</p>
      )}
      {!schedules.loading && schedules.items.length > 0 && (
        <ul aria-label="Envíos programados" className={styles.list}>
          {schedules.items.map((item) => {
            const status = statusOf(item);
            return (
              <li key={item.id} className={styles.item}>
                <span aria-hidden className={styles.icon}><Mail size={20} /></span>
                <div className={styles.text}>
                  <p className={styles.mail}>{item.correo}</p>
                  <p className={styles.plan}>{REPORT_TITLES[item.tipo]} · {daysText(item.dias)} a las {formatClock(item.hora)}</p>
                  <p className={cn(styles.status, status.tone && styles[status.tone])}><status.Icon size={12} aria-hidden /> {status.text}</p>
                </div>
                <span className={styles.tools}>
                  <Switch checked={item.activo} label={`Envío a ${item.correo} activo`} disabled={Boolean(schedules.busy)} onChange={() => schedules.toggle(item)} />
                  <IconButton icon={Send} label={`Enviar ahora a ${item.correo}`} disabled={Boolean(schedules.busy)} onClick={() => schedules.sendNow(item)} />
                  <IconButton icon={Pencil} tone="edit" label={`Modificar el envío a ${item.correo}`} onClick={() => schedules.openEdit(item)} />
                  <IconButton icon={Trash2} tone="danger" label={`Borrar el envío a ${item.correo}`} onClick={() => schedules.askRemove(item)} />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
