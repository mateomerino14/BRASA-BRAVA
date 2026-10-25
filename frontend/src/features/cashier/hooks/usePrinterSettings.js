import {useState} from 'react';
import {useDesktopPrinters} from '../../../hooks/useDesktopPrinters';
import {printOnDesktop} from '../../../lib/desktopPrinting';

const emptyDraft = {cocina: '', caja: ''};

export function usePrinterSettings({testDocument}) {
  const desktop = useDesktopPrinters();
  const [open, setOpen] = useState(false);
  const [installed, setInstalled] = useState([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tests, setTests] = useState({});

  const show = async () => {
    setOpen(true);
    setLoading(true);
    setError('');
    setTests({});
    setDraft({cocina: desktop.printers.cocina ?? '', caja: desktop.printers.caja ?? ''});
    try {
      setInstalled(await desktop.list());
    }
    catch (problem) {
      setError(problem.message);
    }
    finally {
      setLoading(false);
    }
  };

  const test = async (destino) => {
    setTests((current) => ({...current, [destino]: {kind: 'sending', text: 'Enviando la hoja de prueba…'}}));
    const result = await printOnDesktop(destino, testDocument(destino, draft[destino]), draft[destino]);
    let status = {kind: 'error', text: result.error};
    if (result.ok) {
      status = {kind: 'ok', text: `Se imprimió en ${result.impresora}`};
    }
    setTests((current) => ({...current, [destino]: status}));
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await desktop.save({cocina: draft.cocina || null, caja: draft.caja || null});
      setOpen(false);
      return true;
    }
    catch (problem) {
      setError(problem.message);
      return false;
    }
    finally {
      setSaving(false);
    }
  };

  return {
    isDesktop: desktop.isDesktop,
    current: desktop.printers,
    open,
    show,
    close: () => setOpen(false),
    installed,
    draft,
    change: (destino, value) => setDraft((current) => ({...current, [destino]: value})),
    loading,
    saving,
    error,
    tests,
    test,
    save,
  };
}
