import {useState} from 'react';
import {useToast} from '../../../context/useToast';
import {reportsApi} from '../services/reportsApi';
import {EMPTY_SCHEDULE} from '../constants/reports';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validate = (values) => {
  const errors = {};
  if (!EMAIL_PATTERN.test(values.correo.trim())) {
    errors.correo = 'Ingrese un correo válido';
  }
  if (!values.dias.includes('1')) {
    errors.dias = 'Elija al menos un día';
  }
  if (!values.hora) {
    errors.hora = 'Elija la hora';
  }
  return errors;
};

// Envíos programados del reporte (solo el DIRECTORIO): lista, alta, cambios, pausa, borrar y enviar ahora
export function useSchedules({api = reportsApi} = {}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({open: false, editing: null, values: EMPTY_SCHEDULE, errors: {}, saving: false});
  const [busy, setBusy] = useState('');
  const [removing, setRemoving] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      setItems((await api.schedules()).programados);
    }
    catch (problem) {
      toast.error(problem.message, 'No se pudieron cargar los envíos');
    }
    finally {
      setLoading(false);
    }
  };

  const replace = (programado) => setItems((current) => current.map((item) => {
    if (item.id !== programado.id) {
      return item;
    }
    return programado;
  }));

  const save = async () => {
    const values = {...form.values, correo: form.values.correo.trim()};
    const errors = validate(values);
    if (Object.keys(errors).length > 0) {
      setForm((current) => ({...current, errors}));
      return;
    }
    setForm((current) => ({...current, saving: true}));
    try {
      if (form.editing) {
        replace((await api.updateSchedule(form.editing.id, values)).programado);
        toast.success(`Se actualizó el envío a ${values.correo}`);
      }
      else {
        const {programado} = await api.createSchedule(values);
        setItems((current) => [...current, programado]);
        toast.success(`Se programó el envío a ${programado.correo}`);
      }
      setForm((current) => ({...current, open: false, saving: false}));
    }
    catch (problem) {
      toast.error(problem.message, 'No se pudo guardar el envío');
      setForm((current) => ({...current, saving: false}));
    }
  };

  // Ejecuta una acción sobre un envío mostrando su botón como ocupado
  const run = async (key, action, success) => {
    setBusy(key);
    try {
      const result = await action();
      if (result?.programado) {
        replace(result.programado);
      }
      toast.success(success);
      return true;
    }
    catch (problem) {
      toast.error(problem.message, 'No se pudo completar');
      return false;
    }
    finally {
      setBusy('');
    }
  };

  return {
    open,
    show: () => {
      setOpen(true);
      load();
    },
    close: () => setOpen(false),
    items,
    loading,
    form,
    openCreate: () => setForm({open: true, editing: null, values: EMPTY_SCHEDULE, errors: {}, saving: false}),
    openEdit: (item) => setForm({open: true, editing: item, values: {correo: item.correo, tipo: item.tipo, dias: item.dias, hora: item.hora}, errors: {}, saving: false}),
    closeForm: () => setForm((current) => ({...current, open: false})),
    change: (changes) => setForm((current) => ({...current, values: {...current.values, ...changes}, errors: {}})),
    save,
    busy,
    toggle: (item) => {
      let message = `Se pausó el envío a ${item.correo}`;
      if (!item.activo) {
        message = `Se reactivó el envío a ${item.correo}`;
      }
      return run(`toggle-${item.id}`, () => api.setScheduleStatus(item.id, !item.activo), message);
    },
    sendNow: (item) => run(`send-${item.id}`, () => api.sendSchedule(item.id), `Se envió el reporte a ${item.correo}`),
    removing,
    askRemove: setRemoving,
    cancelRemove: () => setRemoving(null),
    confirmRemove: async () => {
      const item = removing;
      setRemoving(null);
      if (await run(`remove-${item.id}`, () => api.deleteSchedule(item.id), `Se borró el envío a ${item.correo}`)) {
        setItems((current) => current.filter((entry) => entry.id !== item.id));
      }
    },
  };
}
