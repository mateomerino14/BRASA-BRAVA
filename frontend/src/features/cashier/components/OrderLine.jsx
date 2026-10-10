import {Badge} from '../../../components/atoms/Badge';
import {formatAmount} from '../../../lib/format';
import {exclusionText} from '../utils/cart';

const styles = {
  line: 'flex flex-col gap-2 py-3',
  top: 'flex items-start justify-between gap-3',
  text: 'flex min-w-0 flex-col gap-1',
  name: 'text-sm font-semibold leading-tight text-carbon',
  quantity: 'text-cafe',
  tags: 'flex flex-wrap gap-1',
  exclusions: 'text-xs font-medium text-rojo',
  subtotal: 'shrink-0 text-sm font-semibold tabular-nums text-carbon',
  actions: 'flex items-center justify-between gap-2',
};

// Una línea del pedido: nombre, cantidad, consumo, ingredientes quitados y subtotal; "actions" agrega los controles de edición
export function OrderLine({line, showQuantity = true, actions}) {
  const combo = line.tipo === 'promocion';
  const removed = exclusionText(line.exclusiones, {combo});
  return (
    <div className={styles.line}>
      <div className={styles.top}>
        <div className={styles.text}>
          <span className={styles.name}>
            {showQuantity && <span className={styles.quantity}>{line.cantidad}× </span>}
            {line.nombre}
          </span>
          <span className={styles.tags}>
            {combo && <Badge tone="brand">Promoción</Badge>}
            {line.consumo === 'llevar' && <Badge tone="warning">Para llevar</Badge>}
            {line.listos !== undefined && line.listos === line.cantidad && <Badge tone="success">Listo</Badge>}
            {line.listos !== undefined && line.listos < line.cantidad && <Badge tone="neutral">{line.listos}/{line.cantidad} listos</Badge>}
          </span>
          {removed && <span className={styles.exclusions}>{removed}</span>}
        </div>
        <span className={styles.subtotal}>Bs {formatAmount(line.subtotal)}</span>
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
