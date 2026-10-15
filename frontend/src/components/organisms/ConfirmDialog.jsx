import {Modal} from './Modal';
import {Button} from '../atoms/Button';

const styles = {
  message: 'text-base text-carbon',
  actions: 'mt-6 grid gap-3 sm:grid-cols-2',
};

export function ConfirmDialog({open, title, message, confirmLabel, tone = 'danger', loading = false, onConfirm, onCancel}) {
  return (
    <Modal open={open} closeButton={false} onClose={onCancel} title={title} size="sm">
      <p className={styles.message}>{message}</p>
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
