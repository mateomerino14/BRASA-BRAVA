import {useEffect, useState} from 'react';
import {cashierApi} from '../services/cashierApi';
import {buildCheckout, emptyCheckout} from '../utils/checkout';

// Cobro de la mesa: formulario de pago, envío a la API y ticket resultante para imprimir
export function useCheckout({api = cashierApi, idMesa, total}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(emptyCheckout);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState({open: false, ticket: null, printedAt: null});
  const [taxLink, setTaxLink] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const settings = await api.settings();
        if (!cancelled) {
          setTaxLink(settings.enlaceImpuestos);
        }
      }
      catch {
        if (!cancelled) {
          setTaxLink('');
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [api]);

  const preview = buildCheckout(values, total);

  const start = () => {
    setValues(emptyCheckout);
    setErrors({});
    setError('');
    setOpen(true);
  };

  const change = (changes) => {
    setValues((current) => ({...current, ...changes}));
    setErrors({});
    setError('');
  };

  const confirm = async () => {
    const result = buildCheckout(values, total);
    if (Object.keys(result.errors).length > 0) {
      setErrors(result.errors);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const response = await api.checkout(idMesa, result.payload);
      setOpen(false);
      setReceipt({open: true, ticket: response.ticket, printedAt: new Date()});
    }
    catch (problem) {
      setError(problem.message);
    }
    finally {
      setSaving(false);
    }
  };

  return {
    open,
    values,
    errors,
    error,
    saving,
    cambio: preview.cambio,
    taxLink,
    receipt,
    start,
    change,
    confirm,
    close: () => setOpen(false),
    closeReceipt: () => setReceipt((current) => ({...current, open: false})),
  };
}
