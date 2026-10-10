import {motion} from 'motion/react';
import {CheckCheck, Clock, RotateCcw, UserRound} from 'lucide-react';
import {Badge} from '../../../components/atoms/Badge';
import {Button} from '../../../components/atoms/Button';
import {ProgressBar} from '../../../components/atoms/ProgressBar';
import {cn} from '../../../lib/cn';
import {formatTime} from '../../../lib/format';
import {waitMinutes, waitTone} from '../utils/kitchen';
import {KitchenLine} from './KitchenLine';

const styles = {
  card: 'flex flex-col gap-4 rounded-3xl border-2 bg-white p-4 shadow-card sm:p-5',
  borders: {success: 'border-verde/50', warning: 'border-mostaza', danger: 'border-rojo', done: 'border-arena/40'},
  header: 'flex items-start justify-between gap-3',
  title: 'font-display text-3xl leading-none text-carbon',
  meta: 'mt-1 text-sm text-cafe',
  people: 'flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-cafe',
  row: 'flex items-center gap-1.5',
  progress: 'flex flex-col gap-1.5',
  progressText: 'flex justify-between text-sm font-semibold text-carbon',
  lines: 'flex flex-col gap-2',
};

const timerTone = {success: 'success', warning: 'warning', danger: 'danger'};

// Tarjeta de un envío a cocina: mesa, tiempo de espera con semáforo, avance y sus líneas
export function ShipmentCard({shipment, now, busy, onMarkLine, onMarkShipment}) {
  const done = shipment.estado === 'listo';
  const minutes = waitMinutes(shipment.creadoEn, now);
  const tone = waitTone(minutes);
  let border = styles.borders[tone];
  if (done) {
    border = styles.borders.done;
  }
  return (
    <motion.article layout aria-label={`${shipment.mesa}, envío ${shipment.envio}`} className={cn(styles.card, border)}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>{shipment.mesa}</h2>
          <p className={styles.meta}>{shipment.seccion} · Pedido Nº {shipment.numero} · Envío {shipment.envio}</p>
        </div>
        {done ? (
          <Badge tone="success" dot>Listo</Badge>
        ) : (
          <Badge tone={timerTone[tone]}>
            <Clock size={12} aria-hidden />
            {minutes} min
          </Badge>
        )}
      </header>

      <div className={styles.people}>
        <span className={styles.row}><UserRound size={14} aria-hidden />{shipment.mesero}</span>
        <span>Pedido a las {formatTime(shipment.creadoEn)}</span>
        {shipment.modificadoPor && <Badge tone="warning">Modificado por {shipment.modificadoPor}</Badge>}
      </div>

      <div className={styles.progress}>
        <span className={styles.progressText}>
          <span>{shipment.listas} de {shipment.unidades} listas</span>
        </span>
        <ProgressBar value={shipment.listas} max={shipment.unidades} label={`Avance de ${shipment.mesa}`} tone={done ? 'success' : 'brand'} />
      </div>

      <ul aria-label={`Productos de ${shipment.mesa}`} className={styles.lines}>
        {shipment.lineas.map((line) => (
          <KitchenLine key={line.id} line={line} busy={busy === `line-${line.id}` || busy === `shipment-${shipment.id}`} onMark={onMarkLine} />
        ))}
      </ul>

      {done ? (
        <Button variant="outline" fullWidth icon={<RotateCcw size={18} aria-hidden />} loading={busy === `shipment-${shipment.id}`} onClick={() => onMarkShipment(shipment, 'ninguno')}>
          Volver a preparación
        </Button>
      ) : (
        <Button variant="dark" fullWidth icon={<CheckCheck size={18} aria-hidden />} loading={busy === `shipment-${shipment.id}`} onClick={() => onMarkShipment(shipment, 'todos')}>
          Todo listo
        </Button>
      )}
    </motion.article>
  );
}
