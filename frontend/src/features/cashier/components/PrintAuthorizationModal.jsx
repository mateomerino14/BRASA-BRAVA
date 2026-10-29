import {Button} from '../../../components/atoms/Button';
import {Input} from '../../../components/atoms/Input';
import {PasswordInput} from '../../../components/atoms/PasswordInput';
import {FormField} from '../../../components/molecules/FormField';
import {Modal} from '../../../components/organisms/Modal';
import {formatAmount, formatTime} from '../../../lib/format';

const styles = {
  form: 'flex flex-col gap-4',
  history: 'flex flex-col gap-1 rounded-xl bg-white/70 p-3 text-xs text-cafe',
  row: 'flex justify-between gap-3',
  time: 'tabular-nums',
  actions: 'grid gap-3 sm:grid-cols-2',
};

export function PrintAuthorizationModal({authorization}) {
  const {request, values, errors} = authorization;
  const ticket = request?.ticket;
  const submit = (event) => {
    event.preventDefault();
    authorization.confirm();
  };
  return (
    <Modal
      open={Boolean(request)}
      onClose={authorization.cancel}
      title={`Ticket ya impreso ${request?.impresiones.length ?? 0} veces`}
      description={ticket && `Pedido Nº ${ticket.numero} · ${ticket.mesa} · Bs ${formatAmount(ticket.total)}. Para imprimirlo otra vez, un empleado con acceso a Caja debe ingresar su usuario y contraseña; quedará registrado que él lo autorizó.`}
      size="sm"
    >
      <form noValidate onSubmit={submit} className={styles.form}>
        {request && request.impresiones.length > 0 && (
          <ul aria-label="Impresiones anteriores" className={styles.history}>
            {request.impresiones.map((item) => (
              <li key={item.numero} className={styles.row}>
                <span>{item.numero}ª impresión · {item.impresoPor}{item.autorizadoPor && ` (autorizó ${item.autorizadoPor})`}</span>
                <span className={styles.time}>{formatTime(item.impresoEn)}</span>
              </li>
            ))}
          </ul>
        )}
        <FormField label="Usuario de quien autoriza" required error={errors.alias}>
          {(field) => <Input {...field} autoComplete="off" value={values.alias} onChange={(event) => authorization.change({alias: event.target.value})} />}
        </FormField>
        <FormField label="Contraseña" required error={errors.contrasena}>
          {(field) => <PasswordInput {...field} autoComplete="off" value={values.contrasena} onChange={(event) => authorization.change({contrasena: event.target.value})} />}
        </FormField>
        <div className={styles.actions}>
          <Button variant="outline" action="cancel" disabled={authorization.saving} onClick={authorization.cancel}>Cancelar</Button>
          <Button type="submit" action="print" loading={authorization.saving}>Autorizar e imprimir</Button>
        </div>
      </form>
    </Modal>
  );
}
