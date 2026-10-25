import {formatTime} from '../../../lib/format';

const styles = {
  ticket: 'font-mono text-[13px] leading-snug text-black',
  brand: 'text-center text-base font-bold tracking-widest',
  center: 'text-center',
  rule: 'my-2 border-t border-dashed border-black',
};

const LABELS = {cocina: 'COCINA', caja: 'CAJA'};

export function PrinterTestTicket({destino, printer, printedAt}) {
  return (
    <article aria-label="Hoja de prueba" className={styles.ticket}>
      <p className={styles.brand}>BRASA BRAVA</p>
      <p className={styles.center}>HOJA DE PRUEBA · {LABELS[destino]}</p>
      <div className={styles.rule} />
      <p>Impresora: {printer}</p>
      <p>Hora: {formatTime(printedAt)}</p>
      <div className={styles.rule} />
      <p className={styles.center}>Si lee esta línea completa, el ancho es correcto.</p>
      <p>1234567890123456789012345678901234567890123456</p>
    </article>
  );
}
