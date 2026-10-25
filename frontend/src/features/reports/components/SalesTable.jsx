import {Eye} from 'lucide-react';
import {formatAmount, formatDayMonthYear, formatTime} from '../../../lib/format';
import {isoDate} from '../utils/reports';

const styles = {
  wrap: 'overflow-x-auto rounded-3xl border border-arena/40 bg-white shadow-card',
  table: 'w-full min-w-[820px] text-sm',
  head: 'bg-carbon text-left text-xs uppercase tracking-wider text-crema',
  th: 'px-4 py-3 font-bold',
  num: 'text-right tabular-nums',
  body: 'divide-y divide-arena/40',
  row: 'cursor-pointer transition-colors hover:bg-hueso/60 focus-within:bg-hueso/60',
  td: 'px-4 py-2.5 text-carbon',
  number: 'font-display text-lg',
  muted: 'text-cafe',
  total: 'font-semibold',
  view: 'flex size-8 items-center justify-center rounded-lg text-brasa-oscuro transition-colors hover:bg-brasa/10 focus-visible:outline-2 focus-visible:outline-brasa',
  srOnly: 'sr-only',
};

// Una fila por venta; tocarla (o su ojo) abre su detalle en una ventana
export function SalesTable({report, onOpen}) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <caption className={styles.srOnly}>Ventas cobradas</caption>
        <thead className={styles.head}>
          <tr>
            <th scope="col" className={styles.th}>Nº</th>
            <th scope="col" className={styles.th}>Cobrada</th>
            <th scope="col" className={styles.th}>Mesa</th>
            <th scope="col" className={styles.th}>Abrió / Cobró</th>
            <th scope="col" className={`${styles.th} ${styles.num}`}>Efectivo</th>
            <th scope="col" className={`${styles.th} ${styles.num}`}>QR</th>
            <th scope="col" className={`${styles.th} ${styles.num}`}>Total</th>
            <th scope="col" className={styles.th}><span className={styles.srOnly}>Ver</span></th>
          </tr>
        </thead>
        <tbody className={styles.body}>
          {report.ventas.map((sale) => {
            return (
              <tr key={sale.id} onClick={() => onOpen(sale)} className={styles.row}>
                <td className={`${styles.td} ${styles.number}`}>{sale.numero}</td>
                <td className={`${styles.td} ${styles.muted}`}>{formatDayMonthYear(isoDate(new Date(sale.cerradaEn)))} · {formatTime(sale.cerradaEn)}</td>
                <td className={styles.td}>{sale.mesa} · {sale.seccion}</td>
                <td className={styles.td}>{sale.abrio} <span className={styles.muted}>/ {sale.cobrador ?? '—'}</span></td>
                <td className={`${styles.td} ${styles.num}`}>{formatAmount(sale.efectivo)}</td>
                <td className={`${styles.td} ${styles.num}`}>{formatAmount(sale.qr)}</td>
                <td className={`${styles.td} ${styles.num} ${styles.total}`}>{formatAmount(sale.total)}</td>
                <td className={styles.td}>
                  <button
                    type="button"
                    aria-label={`Ver la venta ${sale.numero}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpen(sale);
                    }}
                    className={styles.view}
                  >
                    <Eye size={17} aria-hidden />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
