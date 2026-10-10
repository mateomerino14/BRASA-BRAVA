import {useState} from 'react';
import {cashierApi} from '../services/cashierApi';

const emptySales = {hoy: '', ventas: [], resumen: {cantidad: 0, total: 0, efectivo: 0, qr: 0}};

// Resumen de las ventas cobradas hoy, reimpresión de tickets y enlace a la página de impuestos
export function useTodaySales({api = cashierApi} = {}) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(emptySales);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState({open: false, ticket: null, printedAt: null});
  const [taxLink, setTaxLink] = useState('');
  const [linkDraft, setLinkDraft] = useState(null);
  const [linkError, setLinkError] = useState('');
  const [savingLink, setSavingLink] = useState(false);

  const show = async () => {
    setOpen(true);
    setLoading(true);
    setError('');
    setLinkDraft(null);
    try {
      const [sales, settings] = await Promise.all([api.todaySales(), api.settings()]);
      setData(sales);
      setTaxLink(settings.enlaceImpuestos);
    }
    catch (problem) {
      setError(problem.message);
    }
    finally {
      setLoading(false);
    }
  };

  const reprint = async (sale) => {
    try {
      const result = await api.receipt(sale.id);
      setReceipt({open: true, ticket: result.ticket, printedAt: new Date()});
    }
    catch (problem) {
      setError(problem.message);
    }
  };

  const saveLink = async () => {
    setSavingLink(true);
    setLinkError('');
    try {
      const settings = await api.saveSettings({enlaceImpuestos: linkDraft});
      setTaxLink(settings.enlaceImpuestos);
      setLinkDraft(null);
    }
    catch (problem) {
      setLinkError(problem.message);
    }
    finally {
      setSavingLink(false);
    }
  };

  return {
    open,
    show,
    close: () => setOpen(false),
    ...data,
    loading,
    error,
    receipt,
    reprint,
    closeReceipt: () => setReceipt((current) => ({...current, open: false})),
    taxLink,
    linkDraft,
    editLink: () => {
      setLinkDraft(taxLink);
      setLinkError('');
    },
    changeLink: setLinkDraft,
    cancelLink: () => setLinkDraft(null),
    saveLink,
    linkError,
    savingLink,
  };
}
