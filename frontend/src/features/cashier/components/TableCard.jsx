import {motion} from 'motion/react';
import {Armchair, ChefHat, Clock, ShoppingBag, UserRound} from 'lucide-react';
import {Amount} from '../../../components/atoms/Amount';
import {Badge} from '../../../components/atoms/Badge';
import {cn} from '../../../lib/cn';
import {formatAmount} from '../../../lib/format';
import {elapsedText} from '../utils/cart';

const styles = {
  card: 'flex min-h-36 w-full min-w-0 flex-col gap-3 rounded-card border-2 p-4 text-left shadow-card transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brasa',
  free: 'border-arena/50 bg-white hover:border-verde',
  busy: 'border-rojo/50 bg-rojo/5 hover:border-rojo',
  top: 'flex flex-wrap items-start justify-between gap-x-2 gap-y-1',
  name: 'whitespace-nowrap font-display text-2xl leading-none text-carbon sm:text-3xl',
  meta: 'flex flex-col gap-1 text-sm text-cafe',
  row: 'flex min-w-0 items-center gap-1.5',
  truncate: 'truncate',
  ready: 'font-semibold text-verde',
  bottom: 'mt-auto flex items-end justify-between gap-2',
};

const hoverLift = {y: -3};
const tapPress = {scale: 0.97};

export function TableCard({mesa, now, onSelect}) {
  const {venta} = mesa;
  let label = `${mesa.nombre}, libre, ${mesa.capacidad} personas`;
  if (venta) {
    label = `${mesa.nombre}, ocupada, Bs ${formatAmount(venta.total)}`;
  }
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={() => onSelect(mesa)}
      whileHover={hoverLift}
      whileTap={tapPress}
      className={cn(styles.card, venta ? styles.busy : styles.free)}
    >
      <span className={styles.top}>
        <span className={styles.name}>{mesa.nombre}</span>
        {venta ? <Badge tone="danger" dot>Ocupada</Badge> : <Badge tone="success" dot>Libre</Badge>}
      </span>
      {venta ? (
        <>
          <span className={styles.meta}>
            <span className={styles.row}><UserRound size={14} aria-hidden /><span className={styles.truncate}>{venta.mesero}</span></span>
            <span className={styles.row}><Clock size={14} aria-hidden />{elapsedText(venta.abiertaEn, now)}</span>
            <span className={cn(styles.row, venta.listos === venta.unidades && styles.ready)}>
              <ChefHat size={14} aria-hidden />
              {venta.listos === venta.unidades ? 'Todo listo' : `${venta.listos} de ${venta.unidades} listos`}
            </span>
          </span>
          <span className={styles.bottom}>
            <span className={styles.row}><ShoppingBag size={14} aria-hidden />{venta.unidades} u.</span>
            <Amount prefix="Bs" value={formatAmount(venta.total)} />
          </span>
        </>
      ) : (
        <span className={cn(styles.meta, 'mt-auto')}>
          <span className={styles.row}><Armchair size={14} aria-hidden />{mesa.capacidad} personas</span>
        </span>
      )}
    </motion.button>
  );
}
