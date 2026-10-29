import {useCallback, useEffect, useState} from 'react';
import {useToast} from '../../../context/useToast';
import {countText} from '../../../lib/format';
import {deletionApi} from '../services/deletionApi';
import {CONFIRMATION_WORD, emptySelection} from '../constants/deletion';
import {isoDate} from '../../reports/utils/reports';

const DAYS_BACK = 30;

const defaultRange = () => {
  const today = new Date();
  const from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - DAYS_BACK);
  return {desde: isoDate(from), hasta: isoDate(today)};
};

const totalOf = (selection) => Object.values(selection).reduce((total, ids) => total + ids.length, 0);

export function useDeletion({api = deletionApi} = {}) {
  const toast = useToast();
  const [tipo, setTipo] = useState('empleados');
  const [range, setRange] = useState(defaultRange);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const [selection, setSelection] = useState(emptySelection);
  const [preview, setPreview] = useState({open: false, data: null, loading: false});
  const [confirmacion, setConfirmacion] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const result = await api.candidates(tipo, range);
        if (!cancelled) {
          setRows(result.registros);
        }
      }
      catch (problem) {
        if (!cancelled) {
          setRows([]);
          toast.error(problem.message, 'No se pudo cargar la lista');
        }
      }
      finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [api, tipo, range, version, toast]);

  const changeTipo = (next) => {
    if (next !== tipo) {
      setLoading(true);
      setTipo(next);
    }
  };

  const changeRange = (changes) => {
    setLoading(true);
    setRange((current) => ({...current, ...changes}));
  };

  const toggle = (id) => setSelection((current) => {
    const list = current[tipo];
    if (list.includes(id)) {
      return {...current, [tipo]: list.filter((item) => item !== id)};
    }
    return {...current, [tipo]: [...list, id]};
  });

  const markAll = () => setSelection((current) => ({...current, [tipo]: rows.map((row) => row.id)}));
  const clearMarks = () => setSelection((current) => ({...current, [tipo]: []}));

  const openPreview = useCallback(async () => {
    setPreview({open: true, data: null, loading: true});
    setConfirmacion('');
    setConfirmError('');
    try {
      setPreview({open: true, data: await api.preview(selection), loading: false});
    }
    catch (problem) {
      setPreview({open: false, data: null, loading: false});
      toast.error(problem.message, 'No se pudo revisar lo elegido');
    }
  }, [api, selection, toast]);

  const execute = async () => {
    if (confirmacion.trim() !== CONFIRMATION_WORD) {
      setConfirmError(`Escriba ${CONFIRMATION_WORD} para confirmar`);
      return;
    }
    setExecuting(true);
    try {
      const {borrados} = await api.execute(selection, CONFIRMATION_WORD);
      const total = Object.values(borrados).reduce((sum, value) => sum + value, 0);
      toast.success(`Se eliminaron ${countText(total, 'registro', 'registros')} para siempre`);
      setPreview({open: false, data: null, loading: false});
      setSelection(emptySelection());
      setLoading(true);
      setVersion((current) => current + 1);
    }
    catch (problem) {
      toast.error(problem.message, 'No se pudo eliminar');
    }
    finally {
      setExecuting(false);
    }
  };

  return {
    tipo,
    changeTipo,
    range,
    changeRange,
    rows,
    loading,
    selection,
    selected: selection[tipo],
    total: totalOf(selection),
    toggle,
    markAll,
    clearMarks,
    preview,
    openPreview,
    closePreview: () => setPreview({open: false, data: null, loading: false}),
    confirmacion,
    changeConfirmacion: (value) => {
      setConfirmacion(value);
      setConfirmError('');
    },
    confirmError,
    execute,
    executing,
  };
}
