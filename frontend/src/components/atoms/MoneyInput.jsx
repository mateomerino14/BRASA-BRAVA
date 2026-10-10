import {cn} from '../../lib/cn';
import {Input} from './Input';

const styles = {
  wrapper: 'relative',
  prefix: 'pointer-events-none absolute inset-y-0 left-4 flex items-center font-semibold text-cafe',
  input: 'pl-11 text-right tabular-nums',
};

// Campo de monto en bolivianos: muestra "Bs" y abre el teclado numérico con decimales
export function MoneyInput({className, ...props}) {
  return (
    <div className={cn(styles.wrapper, className)}>
      <span aria-hidden className={styles.prefix}>Bs</span>
      <Input inputMode="decimal" autoComplete="off" placeholder="0,00" className={styles.input} {...props} />
    </div>
  );
}
