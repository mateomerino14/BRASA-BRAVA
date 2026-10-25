import {Printer} from 'lucide-react';
import {Modal} from '../../../components/organisms/Modal';
import {Alert} from '../../../components/molecules/Alert';
import {FormField} from '../../../components/molecules/FormField';
import {Button} from '../../../components/atoms/Button';
import {Select} from '../../../components/atoms/Select';
import {Spinner} from '../../../components/atoms/Spinner';

const styles = {
  body: 'flex flex-col gap-5',
  intro: 'text-sm text-cafe',
  row: 'flex flex-col gap-2',
  testRow: 'flex flex-wrap items-center gap-3',
  actions: 'grid gap-3 sm:grid-cols-2',
  loading: 'flex justify-center py-8',
};

const DESTINATIONS = [
  {value: 'cocina', label: 'Impresora de cocina', hint: 'Las comandas salen aquí al enviar a cocina.'},
  {value: 'caja', label: 'Impresora de caja', hint: 'El ticket de venta sale aquí al cobrar.'},
];

const TEST_TONES = {ok: 'success', error: 'error', sending: 'info'};

// Elige en qué impresora de Windows sale cada documento (solo en la app de escritorio)
export function PrintersModal({settings}) {
  const options = settings.installed.map((item) => {
    let label = item.displayName;
    if (item.isDefault) {
      label = `${item.displayName} (predeterminada)`;
    }
    return {value: item.name, label};
  });
  return (
    <Modal open={settings.open} onClose={settings.close} title="Impresoras" description="Solo para esta computadora de caja." size="md">
      <div className={styles.body}>
        <p className={styles.intro}>
          Elija la ticketera de cada lugar. Las que no elija se imprimen con el diálogo de impresión, como en el navegador.
        </p>
        {settings.error && <Alert tone="error">{settings.error}</Alert>}
        {settings.loading ? (
          <div className={styles.loading}><Spinner size={28} label="Buscando impresoras" /></div>
        ) : (
          DESTINATIONS.map((destination) => {
            const status = settings.tests[destination.value];
            return (
              <div key={destination.value} className={styles.row}>
                <FormField label={destination.label} hint={destination.hint}>
                  {(field) => (
                    <Select
                      {...field}
                      placeholder="Sin elegir (usar el diálogo)"
                      options={options}
                      value={settings.draft[destination.value]}
                      onChange={(event) => settings.change(destination.value, event.target.value)}
                    />
                  )}
                </FormField>
                <div className={styles.testRow}>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Printer size={15} aria-hidden />}
                    disabled={!settings.draft[destination.value]}
                    loading={status?.kind === 'sending'}
                    onClick={() => settings.test(destination.value)}
                  >
                    Imprimir prueba
                  </Button>
                </div>
                {status && status.kind !== 'sending' && <Alert tone={TEST_TONES[status.kind]}>{status.text}</Alert>}
              </div>
            );
          })
        )}
        <div className={styles.actions}>
          <Button variant="outline" action="cancel" onClick={settings.close} disabled={settings.saving}>Cancelar</Button>
          <Button action="save" onClick={settings.save} loading={settings.saving}>Guardar</Button>
        </div>
      </div>
    </Modal>
  );
}
