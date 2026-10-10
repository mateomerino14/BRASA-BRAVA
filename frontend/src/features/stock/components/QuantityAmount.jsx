import {Amount} from '../../../components/atoms/Amount';
import {quantityParts} from '../../../lib/format';

// Cantidad de stock con el número destacado y la unidad aparte; "sign" antepone + o − (historial)
export function QuantityAmount({value, unit, size, sign = false, valueClassName}) {
  const parts = quantityParts(Math.abs(value), unit);
  let amount = parts.amount;
  if (sign && value > 0) {
    amount = `+${amount}`;
  }
  if (value < 0) {
    amount = `−${amount}`;
  }
  return <Amount value={amount} suffix={parts.unit} size={size} valueClassName={valueClassName} />;
}
