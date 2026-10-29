import {NumberInput} from './NumberInput';

export function MoneyInput(props) {
  return <NumberInput prefix="Bs" placeholder="0,00" {...props} />;
}
