import {formatAmount, formatDayMonthYear} from '../../../lib/format';

const styles = {
  wrap: 'overflow-x-auto rounded-3xl border border-arena/40 bg-white shadow-card',
  table: 'w-full min-w-[560px] text-sm',
  head: 'bg-carbon text-left text-xs uppercase tracking-wider text-crema',
  th: 'px-4 py-3 font-bold',
  num: 'text-right tabular-nums',
  body: 'divide-y divide-arena/40',
  td: 'px-4 py-2.5 text-carbon',
  foot: 'bg-hueso font-semibold text-carbon',
  srOnly: 'sr-only',
};

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const weekday = (iso) => WEEKDAYS[new Date(`${iso}T12:00:00`).getDay()];

// Una fila por día del período con efectivo, QR y total, y la fila del total
export function SummaryTable({report}) {
  const {resumen} = report;
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <caption className={styles.srOnly}>Ventas por día</caption>
        <thead className={styles.head}>
          <tr>
            <th scope="col" className={styles.th}>Día</th>
            <th scope="col" className={`${styles.th} ${styles.num}`}>Ventas</th>
            <th scope="col" className={`${styles.th} ${styles.num}`}>Efectivo Bs</th>
            <th scope="col" className={`${styles.th} ${styles.num}`}>QR Bs</th>
            <th scope="col" className={`${styles.th} ${styles.num}`}>Total Bs</th>
          </tr>
        </thead>
        <tbody className={styles.body}>
          {report.dias.map((day) => (
            <tr key={day.fecha}>
              <td className={styles.td}>{weekday(day.fecha)} {formatDayMonthYear(day.fecha)}</td>
              <td className={`${styles.td} ${styles.num}`}>{day.ventas}</td>
              <td className={`${styles.td} ${styles.num}`}>{formatAmount(day.efectivo)}</td>
              <td className={`${styles.td} ${styles.num}`}>{formatAmount(day.qr)}</td>
              <td className={`${styles.td} ${styles.num}`}>{formatAmount(day.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className={styles.foot}>
          <tr>
            <td className={styles.td}>Total del período</td>
            <td className={`${styles.td} ${styles.num}`}>{resumen.cantidad}</td>
            <td className={`${styles.td} ${styles.num}`}>{formatAmount(resumen.efectivo)}</td>
            <td className={`${styles.td} ${styles.num}`}>{formatAmount(resumen.qr)}</td>
            <td className={`${styles.td} ${styles.num}`}>{formatAmount(resumen.total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
