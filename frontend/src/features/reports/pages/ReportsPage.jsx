import {useState} from 'react';
import {Button} from '../../../components/atoms/Button';
import {Spinner} from '../../../components/atoms/Spinner';
import {ConfirmDialog} from '../../../components/organisms/ConfirmDialog';
import {PrintPreview} from '../../../components/organisms/PrintPreview';
import {useAuth} from '../../../context/useAuth';
import {useToast} from '../../../context/useToast';
import {cashierApi} from '../../cashier/services/cashierApi';
import {ReceiptTicket} from '../../cashier/components/ReceiptTicket';
import {PrintAuthorizationModal} from '../../cashier/components/PrintAuthorizationModal';
import {usePrintAuthorization} from '../../cashier/hooks/usePrintAuthorization';
import {ReportActions} from '../components/ReportActions';
import {ReportFilters} from '../components/ReportFilters';
import {ReportTotals} from '../components/ReportTotals';
import {SaleDetailModal} from '../components/SaleDetailModal';
import {SalesTable} from '../components/SalesTable';
import {ScheduleFormModal} from '../components/ScheduleFormModal';
import {SchedulesModal} from '../components/SchedulesModal';
import {SummaryTable} from '../components/SummaryTable';
import {useReports} from '../hooks/useReports';
import {useSchedules} from '../hooks/useSchedules';

const styles = {
  page: 'flex flex-col gap-5',
  bar: 'flex flex-wrap items-center justify-between gap-3',
  period: 'text-sm text-cafe',
  loading: 'flex justify-center py-16',
  empty: 'rounded-3xl border border-dashed border-arena bg-white px-4 py-10 text-center text-sm text-cafe',
};

// Reimpresión del ticket desde el reporte (solo con Caja), con el mismo límite de impresiones
function useReprint() {
  const toast = useToast();
  const authorization = usePrintAuthorization();
  const [receipt, setReceipt] = useState({open: false, ticket: null, printedAt: null});
  const open = async (sale) => {
    try {
      const {ticket} = await cashierApi.receipt(sale.id);
      setReceipt({open: true, ticket, printedAt: new Date()});
    }
    catch (problem) {
      toast.error(problem.message, 'No se pudo abrir el ticket');
    }
  };
  return {authorization, receipt, open, close: () => setReceipt((current) => ({...current, open: false}))};
}

// Reportes de ventas: resumen por día o ventas detalladas de un período, con PDF, correo y envíos programados
export function ReportsPage() {
  const {user} = useAuth();
  const reports = useReports();
  const schedules = useSchedules();
  const reprint = useReprint();
  const canReprint = Boolean(user?.isDirectorio || user?.permissions?.includes('caja'));
  const {report} = reports;

  let content = null;
  if (reports.loading && !report) {
    content = <div className={styles.loading}><Spinner size={32} label="Generando el reporte" /></div>;
  }
  else if (report && report.resumen.cantidad === 0) {
    content = <p className={styles.empty}>No hubo ventas cobradas en este período.</p>;
  }
  else if (report && report.tipo === 'detalle') {
    content = <SalesTable report={report} onOpen={reports.openSale} />;
  }
  else if (report) {
    content = <SummaryTable report={report} />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.bar}>
        <p className={styles.period}>{report && `${report.periodo} · ${report.empleado}`}</p>
        {user?.isDirectorio && <Button variant="outline" size="sm" action="schedule" onClick={schedules.show}>Envíos programados</Button>}
      </div>
      <ReportFilters reports={reports} />
      {report && <ReportActions reports={reports} />}
      {report && <ReportTotals resumen={report.resumen} />}
      {content}

      <SaleDetailModal sale={reports.sale} onClose={reports.closeSale} onReprint={canReprint ? reprint.open : undefined} />
      <PrintPreview
        open={reprint.receipt.open}
        title="Ticket de venta"
        description="Reimpresión"
        destino="caja"
        guard={reprint.receipt.ticket ? () => reprint.authorization.authorize(reprint.receipt.ticket) : undefined}
        onClose={reprint.close}
      >
        {reprint.receipt.ticket && <ReceiptTicket ticket={reprint.receipt.ticket} printedAt={reprint.receipt.printedAt} />}
      </PrintPreview>
      <PrintAuthorizationModal authorization={reprint.authorization} />

      {user?.isDirectorio && (
        <>
          <SchedulesModal schedules={schedules} />
          <ScheduleFormModal schedules={schedules} />
          <ConfirmDialog
            open={Boolean(schedules.removing)}
            title="Borrar envío programado"
            message={`Ya no se enviará el reporte a ${schedules.removing?.correo ?? ''}.`}
            confirmLabel="Borrar"
            onConfirm={schedules.confirmRemove}
            onCancel={schedules.cancelRemove}
          />
        </>
      )}
    </div>
  );
}
