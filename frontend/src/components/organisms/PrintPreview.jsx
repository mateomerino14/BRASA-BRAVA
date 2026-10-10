import {useEffect} from 'react';
import {createPortal} from 'react-dom';
import {Printer} from 'lucide-react';
import {Modal} from './Modal';
import {Button} from '../atoms/Button';

const styles = {
  paper: 'mx-auto w-full max-w-[320px] rounded-lg border border-arena/60 bg-white p-4 shadow-card',
  actions: 'mt-6 grid gap-3 sm:grid-cols-2',
  printOnly: 'print-only',
};

// Vista previa de un documento para la ticketera; "Imprimir" abre el diálogo de impresión con solo ese documento
// "autoPrint" abre el diálogo de impresión apenas se muestra (ticket al cobrar)
export function PrintPreview({open, title, description, onClose, autoPrint = false, children}) {
  useEffect(() => {
    if (open && autoPrint) {
      window.print();
    }
  }, [open, autoPrint]);

  return (
    <>
      <Modal open={open} onClose={onClose} title={title} description={description} size="sm">
        <div className={styles.paper}>{children}</div>
        <div className={styles.actions}>
          <Button variant="outline" onClick={onClose}>Listo</Button>
          <Button icon={<Printer size={18} aria-hidden />} onClick={() => window.print()}>Imprimir</Button>
        </div>
      </Modal>
      {open && createPortal(<div className={styles.printOnly}>{children}</div>, document.body)}
    </>
  );
}
