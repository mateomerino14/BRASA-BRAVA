import {ReceiptText} from 'lucide-react';
import {Button} from '../../../components/atoms/Button';
import {ChipTabs} from '../../../components/molecules/ChipTabs';
import {ScrollRow} from '../../../components/molecules/ScrollRow';
import {TableChip} from './TableChip';

const styles = {
  bar: 'flex flex-col gap-3 rounded-3xl border border-arena/40 bg-white p-3 shadow-card sm:p-4',
  top: 'flex flex-col gap-3 lg:flex-row lg:items-center',
  sections: 'min-w-0 flex-1',
  tools: 'flex shrink-0 flex-wrap gap-2',
  empty: 'px-1 py-3 text-sm text-cafe',
};

// Cada sección muestra cuántas mesas tiene ocupadas (solo si hay alguna)
const sectionOptions = (sections) => sections.map((section) => {
  const busy = section.mesas.filter((table) => table.venta).length;
  const option = {value: String(section.id), label: section.nombre};
  if (busy === 1) {
    option.count = busy;
    option.countLabel = '1 mesa ocupada';
  }
  if (busy > 1) {
    option.count = busy;
    option.countLabel = `${busy} mesas ocupadas`;
  }
  return option;
});

// Barra de arriba de Caja: secciones, Ventas de hoy, Impresoras y las mesas de la sección elegida
export function TablesBar({floor, selectedId, onSelectTable, onShowSales, onShowPrinters}) {
  const {section} = floor;
  return (
    <section aria-label="Mesas" className={styles.bar}>
      <div className={styles.top}>
        {section && <ChipTabs label="Secciones" options={sectionOptions(floor.sections)} value={String(section.id)} onChange={floor.selectSection} className={styles.sections} />}
        <span className={styles.tools}>
          <Button variant="outline" size="sm" icon={<ReceiptText size={16} aria-hidden />} onClick={onShowSales}>Ventas de hoy</Button>
          {onShowPrinters && <Button variant="outline" size="sm" action="print" onClick={onShowPrinters}>Impresoras</Button>}
        </span>
      </div>
      {section && section.mesas.length > 0 && (
        <ScrollRow label={`Mesas de ${section.nombre}`} count={section.mesas.length}>
          {section.mesas.map((mesa) => (
            <TableChip key={mesa.id} mesa={mesa} now={floor.now} active={mesa.id === selectedId} onSelect={onSelectTable} />
          ))}
        </ScrollRow>
      )}
      {section && section.mesas.length === 0 && <p className={styles.empty}>Esta sección no tiene mesas activas.</p>}
    </section>
  );
}
