import {Modal} from './Modal';
import {Button} from '../atoms/Button';
import {Alert} from '../molecules/Alert';

const styles = {
  message: 'text-base text-carbon',
  actions: 'mt-6 grid gap-3 sm:grid-cols-2',
  error: 'mt-4',
};

export function ConfirmDialog({open, title, message, confirmLabel, tone = 'danger', loading = false, error, onConfirm, onCancel}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <p className={styles.message}>{message}</p>
      {error && <Alert tone="error" className={styles.error}>{error}</Alert>}
      <div className={styles.actions}>
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
