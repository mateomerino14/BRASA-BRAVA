import {Button} from '../../../components/atoms/Button';
import {Input} from '../../../components/atoms/Input';
import {FormField} from '../../../components/molecules/FormField';

const styles = {
  card: 'flex flex-col gap-3 rounded-3xl border border-arena/40 bg-white p-4 shadow-card md:flex-row md:items-start',
  divider: 'hidden h-11 w-px self-end bg-arena/60 md:block',
  field: 'flex-1',
  download: 'md:mt-[30px]',
  send: 'md:mt-[30px]',
};

export function ReportActions({reports}) {
  const submit = (event) => {
    event.preventDefault();
    reports.email();
  };
  return (
    <form noValidate onSubmit={submit} aria-label="Descargar o enviar el reporte" className={styles.card}>
      <Button variant="dark" action="download" loading={reports.downloading} onClick={reports.download} className={styles.download}>Descargar PDF</Button>
      <span aria-hidden className={styles.divider} />
      <div className={styles.field}>
        <FormField label="Enviar a este correo" error={reports.correoError}>
          {(field) => <Input {...field} type="email" placeholder="gerencia@brasabrava.bo" value={reports.correo} onChange={(event) => reports.changeCorreo(event.target.value)} />}
        </FormField>
      </div>
      <Button type="submit" variant="outline" action="email" loading={reports.sending} className={styles.send}>Enviar por correo</Button>
    </form>
  );
}
