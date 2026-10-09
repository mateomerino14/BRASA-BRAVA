import {AnimatePresence, motion} from 'motion/react';
import {cn} from '../../lib/cn';

const styles = {
  card: 'overflow-hidden rounded-card border border-arena/40 bg-white shadow-card',
  scroll: 'overflow-x-auto',
  table: 'w-full border-collapse text-left',
  headRow: 'border-b border-arena/40 bg-crema',
  headCell: 'px-4 py-3 font-display text-lg font-normal tracking-wide text-carbon',
  row: 'border-b border-arena/30 transition-colors last:border-b-0 hover:bg-crema/40',
  cell: 'px-4 py-3 align-middle text-sm text-carbon',
  center: 'text-center',
  right: 'text-right',
  skeletonBar: 'h-4 w-full animate-pulse rounded bg-hueso',
  empty: 'px-4 py-12 text-center text-sm text-cafe',
  footer: 'flex flex-wrap items-center justify-between gap-3 border-t border-arena/40 bg-crema px-4 py-3 text-xs text-cafe',
};

const skeletonRows = 5;
const rowHidden = {opacity: 0, y: 8};
const rowVisible = {opacity: 1, y: 0};
const rowExit = {opacity: 0};
const rowStaggerSeconds = 0.04;

const alignClass = (align) => {
  if (align === 'center') {
    return styles.center;
  }
  if (align === 'right') {
    return styles.right;
  }
  return '';
};

function SkeletonRows({columns}) {
  return Array.from({length: skeletonRows}, (_, rowIndex) => (
    <tr key={rowIndex} className={styles.row}>
      {columns.map((column) => (
        <td key={column.key} className={styles.cell}>
          <div className={styles.skeletonBar} />
        </td>
      ))}
    </tr>
  ));
}

export function DataTable({columns, rows, rowKey, loading = false, emptyMessage, footer, caption, rowClassName}) {
  return (
    <div className={styles.card}>
      <div className={styles.scroll}>
        <table className={styles.table}>
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className={styles.headRow}>
              {columns.map((column) => (
                <th key={column.key} scope="col" className={cn(styles.headCell, alignClass(column.align))}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <SkeletonRows columns={columns} />}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className={styles.empty}>
                  {emptyMessage}
                </td>
              </tr>
            )}
            <AnimatePresence initial={false}>
              {!loading && rows.map((row, index) => (
                <motion.tr
                  key={rowKey(row)}
                  layout="position"
                  initial={rowHidden}
                  animate={rowVisible}
                  exit={rowExit}
                  transition={{delay: index * rowStaggerSeconds}}
                  className={cn(styles.row, rowClassName?.(row))}
                >
                  {columns.map((column) => (
                    <td key={column.key} className={cn(styles.cell, alignClass(column.align), column.className)}>
                      {column.render(row)}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}
