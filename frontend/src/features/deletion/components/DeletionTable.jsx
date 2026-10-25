import {Check, TriangleAlert} from 'lucide-react';
import {cn} from '../../../lib/cn';
import {countText, formatAmount, formatDayMonthYear, formatTime} from '../../../lib/format';
import {isoDate} from '../../reports/utils/reports';

const styles = {
  wrap: 'max-h-[55dvh] overflow-auto rounded-2xl border border-arena/50 bg-white',
  table: 'w-full min-w-[560px] text-sm',
  head: 'sticky top-0 z-10 bg-hueso text-left text-xs uppercase tracking-wider text-cafe',
  th: 'px-4 py-2.5 font-bold',
  body: 'divide-y divide-arena/40',
  row: 'cursor-pointer transition-colors hover:bg-hueso/50',
  marked: 'bg-rojo/5 hover:bg-rojo/10',
  td: 'px-4 py-2.5 text-carbon',
  check: 'flex size-5 items-center justify-center rounded border-2 transition-colors',
  checkOn: 'border-rojo bg-rojo text-white',
  checkOff: 'border-arena bg-white text-transparent',
  name: 'font-semibold',
  muted: 'text-cafe',
  warn: 'inline-flex items-center gap-1 text-xs font-semibold text-brasa-oscuro',
  num: 'text-right tabular-nums',
  srOnly: 'sr-only',
};

// Aviso de lo que arrastra un registro ("34 ventas se borran también") o un texto tenue si no arrastra nada
function Drags({count, singular, plural}) {
  if (!count) {
    return <span className={styles.muted}>Nada asociado</span>;
  }
  return <span className={styles.warn}><TriangleAlert size={13} aria-hidden /> {countText(count, singular, plural)} se borran también</span>;
}

const saleWhen = (row) => `${formatDayMonthYear(isoDate(new Date(row.cerradaEn)))} · ${formatTime(row.cerradaEn)}`;

// Columnas de cada tipo: encabezados y celdas
const COLUMNS = {
  empleados: {head: ['Empleado', 'Usuario', 'Cargo', 'Al eliminar'], cells: (row) => [<span key="n" className={styles.name}>{row.nombre}</span>, row.alias, row.cargo, <Drags key="d" count={row.ventas} singular="venta" plural="ventas" />]},
  cargos: {head: ['Cargo', 'Al eliminar'], cells: (row) => [<span key="n" className={styles.name}>{row.nombre}</span>, <Drags key="d" count={row.empleados} singular="empleado" plural="empleados" />]},
  secciones: {head: ['Sección', 'Mesas', 'Al eliminar'], cells: (row) => [<span key="n" className={styles.name}>{row.nombre}</span>, countText(row.mesas, 'mesa', 'mesas'), <Drags key="d" count={row.ventas} singular="venta" plural="ventas" />]},
  productos: {head: ['Producto', 'Categoría', 'Al eliminar'], cells: (row) => [<span key="n" className={styles.name}>{row.nombre}</span>, row.categoria, <Drags key="d" count={row.ventas} singular="venta" plural="ventas" />]},
  categorias: {head: ['Categoría', 'Al eliminar'], cells: (row) => [<span key="n" className={styles.name}>{row.nombre}</span>, <Drags key="d" count={row.productos} singular="producto" plural="productos" />]},
  insumos: {head: ['Insumo', 'Al eliminar'], cells: (row) => [<span key="n" className={styles.name}>{row.nombre}</span>, <Drags key="d" count={row.recetas} singular="receta lo pierde" plural="recetas lo pierden" />]},
  promociones: {head: ['Promoción', 'Al eliminar'], cells: (row) => [<span key="n" className={styles.name}>{row.nombre}</span>, <Drags key="d" count={row.ventas} singular="venta" plural="ventas" />]},
  ventas: {head: ['Nº', 'Cobrada', 'Mesa', 'Cobró', 'Total Bs'], cells: (row) => [<span key="n" className={styles.name}>{row.id}</span>, saleWhen(row), `${row.mesa} · ${row.seccion}`, row.cobrador ?? '—', <span key="t" className={styles.num}>{formatAmount(row.total)}</span>]},
};

// Tabla con casillas para marcar lo que se elimina; toda la fila marca o desmarca
export function DeletionTable({tipo, rows, selected, onToggle, label}) {
  const {head, cells} = COLUMNS[tipo];
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <caption className={styles.srOnly}>{label}</caption>
        <thead className={styles.head}>
          <tr>
            <th scope="col" className={styles.th}><span className={styles.srOnly}>Marcar</span></th>
            {head.map((title) => <th key={title} scope="col" className={styles.th}>{title}</th>)}
          </tr>
        </thead>
        <tbody className={styles.body}>
          {rows.map((row) => {
            const on = selected.includes(row.id);
            return (
              <tr key={row.id} onClick={() => onToggle(row.id)} className={cn(styles.row, on && styles.marked)}>
                <td className={styles.td}>
                  <label className={styles.srOnly} htmlFor={`marcar-${tipo}-${row.id}`}>Marcar {row.nombre ?? `la venta ${row.id}`}</label>
                  <input id={`marcar-${tipo}-${row.id}`} type="checkbox" checked={on} onChange={() => onToggle(row.id)} onClick={(event) => event.stopPropagation()} className={styles.srOnly} />
                  <span aria-hidden className={cn(styles.check, on ? styles.checkOn : styles.checkOff)}><Check size={13} strokeWidth={3} /></span>
                </td>
                {cells(row).map((cell, index) => <td key={index} className={styles.td}>{cell}</td>)}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
