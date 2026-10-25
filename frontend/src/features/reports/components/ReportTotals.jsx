import {formatAmount} from '../../../lib/format';

const styles = {
  grid: 'grid grid-cols-2 gap-3 md:grid-cols-5',
  tile: 'rounded-2xl border border-arena/50 bg-white px-4 py-3',
  label: 'text-xs font-semibold text-cafe',
  value: 'font-display text-3xl leading-none text-carbon',
};

// Totales del período: ventas, total, efectivo, QR y ticket promedio
export function ReportTotals({resumen}) {
  const tiles = [
    ['Ventas', String(resumen.cantidad)],
    ['Total Bs', formatAmount(resumen.total)],
    ['Efectivo Bs', formatAmount(resumen.efectivo)],
    ['QR Bs', formatAmount(resumen.qr)],
    ['Ticket promedio Bs', formatAmount(resumen.promedio)],
  ];
  return (
    <section aria-label="Totales del período" className={styles.grid}>
      {tiles.map(([label, value]) => (
        <div key={label} className={styles.tile}>
          <p className={styles.label}>{label}</p>
          <p className={styles.value}>{value}</p>
        </div>
      ))}
    </section>
  );
}
