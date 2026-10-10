import {AnimatePresence, motion} from 'motion/react';
import {cn} from '../../lib/cn';
import {useMediaQuery} from '../../hooks/useMediaQuery';
import {DESKTOP_QUERY} from '../../config/breakpoints';

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
  cards: 'grid grid-cols-1 md:grid-cols-2',
  cardItem: 'flex min-w-0 flex-col gap-3 border-b border-arena/30 p-4 md:odd:border-r',
  cardTop: 'flex items-start justify-between gap-3',
  cardTitle: 'min-w-0 flex-1',
  cardDetails: 'grid grid-cols-2 gap-x-4 gap-y-2.5',
  cardDetailWide: 'col-span-2',
  cardLabel: 'font-display text-sm tracking-wide text-cafe',
  cardValue: 'text-sm text-carbon',
  cardSkeleton: 'h-16 animate-pulse rounded-lg bg-hueso',
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

// Tarjetas para celular y tablet (dos columnas en tablet): la columna "title" arriba, "actions" a la derecha y el resto como etiqueta y valor
function CardList({columns, rows, rowKey, loading, emptyMessage, caption, rowClassName}) {
  const title = columns.find((column) => column.mobile === 'title');
  const actions = columns.find((column) => column.mobile === 'actions');
  const details = columns.filter((column) => column !== title && column !== actions && column.mobile !== 'hidden');

  if (loading) {
    return (
      <div className={styles.cards}>
        {Array.from({length: skeletonRows}, (_, index) => (
          <div key={index} className={styles.cardItem}>
            <div className={styles.cardSkeleton} />
          </div>
        ))}
      </div>
    );
  }
  if (rows.length === 0) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }
  return (
    <ul aria-label={caption} className={styles.cards}>
      <AnimatePresence initial={false}>
        {rows.map((row, index) => (
          <motion.li
            key={rowKey(row)}
            layout="position"
            initial={rowHidden}
            animate={rowVisible}
            exit={rowExit}
            transition={{delay: index * rowStaggerSeconds}}
            className={cn(styles.cardItem, rowClassName?.(row))}
          >
            {(title || actions) && (
              <div className={styles.cardTop}>
                {title && <div className={styles.cardTitle}>{title.render(row)}</div>}
                {actions && actions.render(row)}
              </div>
            )}
            <dl className={styles.cardDetails}>
              {details.map((column) => (
                <div key={column.key} className={cn(column.wide && styles.cardDetailWide)}>
                  <dt className={styles.cardLabel}>{column.header}</dt>
                  <dd className={styles.cardValue}>{column.render(row)}</dd>
                </div>
              ))}
            </dl>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

// Tabla de datos; en pantallas angostas se convierte en tarjetas para no obligar a desplazarse de lado
export function DataTable({columns, rows, rowKey, loading = false, emptyMessage, footer, caption, rowClassName}) {
  const isWide = useMediaQuery(DESKTOP_QUERY);

  if (!isWide) {
    return (
      <div className={styles.card}>
        <CardList columns={columns} rows={rows} rowKey={rowKey} loading={loading} emptyMessage={emptyMessage} caption={caption} rowClassName={rowClassName} />
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    );
  }

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
