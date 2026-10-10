import {NumberInput} from './NumberInput';

// Campo de monto en bolivianos: muestra "Bs" y abre el teclado numérico con decimales
export function MoneyInput(props) {
  return <NumberInput prefix="Bs" placeholder="0,00" {...props} />;
}
