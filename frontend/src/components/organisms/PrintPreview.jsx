import {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import {Printer} from 'lucide-react';
import {Modal} from './Modal';
import {Button} from '../atoms/Button';
import {Alert} from '../molecules/Alert';
import {useDesktopPrinters} from '../../hooks/useDesktopPrinters';
import {printOnDesktop} from '../../lib/desktopPrinting';

const styles = {
  paper: 'mx-auto w-full max-w-[320px] rounded-lg border border-arena/60 bg-white p-4 shadow-card',
  status: 'mt-4',
  actions: 'mt-6 grid gap-3 sm:grid-cols-2',
  dialog: 'mt-3 w-full',
  printOnly: 'print-only',
};

const idle = {kind: 'idle', text: ''};

const resultStatus = (result) => {
  if (result.ok) {
    return {kind: 'ok', text: `Se imprimió en ${result.impresora}`};
  }
  return {kind: 'error', text: `No se pudo imprimir: ${result.error}. Use "Imprimir con diálogo".`};
};

function PrintActions({destino, printer, autoPrint, guard, onClose, children}) {
  const [status, setStatus] = useState(() => {
    if (autoPrint && printer) {
      return {kind: 'sending', text: `Enviando a ${printer}…`};
    }
    return idle;
  });

  const allowed = async () => !guard || await guard();

  const print = async () => {
    if (!await allowed()) {
      return;
    }
    if (!printer) {
      window.print();
      return;
    }
    setStatus({kind: 'sending', text: `Enviando a ${printer}…`});
    setStatus(resultStatus(await printOnDesktop(destino, children)));
  };

  const printWithDialog = async () => {
    if (await allowed()) {
      window.print();
    }
  };

  const [initial] = useState({autoPrint, printer, destino, guard, children});
  useEffect(() => {
    if (!initial.autoPrint) {
      return undefined;
    }
    let cancelled = false;
    const run = async () => {
      if (initial.guard && !await initial.guard()) {
        if (!cancelled) {
          setStatus(idle);
        }
        return;
      }
      if (!initial.printer) {
        window.print();
        return;
      }
      const result = await printOnDesktop(initial.destino, initial.children);
      if (!cancelled) {
        setStatus(resultStatus(result));
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [initial]);

  return (
    <>
      {status.kind === 'ok' && <Alert tone="success" className={styles.status}>{status.text}</Alert>}
      {status.kind === 'sending' && <Alert tone="info" className={styles.status}>{status.text}</Alert>}
      {status.kind === 'error' && <Alert tone="error" className={styles.status}>{status.text}</Alert>}
      <div className={styles.actions}>
        <Button variant="outline" action="close" onClick={onClose}>Cerrar</Button>
        <Button icon={<Printer size={18} aria-hidden />} loading={status.kind === 'sending'} onClick={print}>Imprimir</Button>
      </div>
      {printer && (
        <Button variant="ghost" size="sm" action="print" className={styles.dialog} onClick={printWithDialog}>Imprimir con diálogo</Button>
      )}
    </>
  );
}

export function PrintPreview({open, title, description, onClose, destino, autoPrint = false, guard, children}) {
  const {printers} = useDesktopPrinters();
  let printer = null;
  if (destino) {
    printer = printers[destino];
  }
  return (
    <>
      <Modal open={open} onClose={onClose} title={title} description={description} size="sm">
        <div className={styles.paper}>{children}</div>
        <PrintActions destino={destino} printer={printer} autoPrint={autoPrint} guard={guard} onClose={onClose}>{children}</PrintActions>
      </Modal>
      {open && createPortal(<div className={styles.printOnly}>{children}</div>, document.body)}
    </>
  );
}
