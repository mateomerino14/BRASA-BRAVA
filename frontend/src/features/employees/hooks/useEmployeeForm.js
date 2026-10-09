import {useState} from 'react';
import {employeesApi} from '../services/employeesApi';
import {EMPTY_FORM} from '../constants/employees';
import {toFormValues, toPayload, validateEmployee} from '../utils/validateEmployee';

export function useEmployeeForm({onSaved, api = employeesApi} = {}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(editing);

  const openCreate = () => {
    setEditing(null);
    setValues(EMPTY_FORM);
    setErrors({});
    setModalError('');
    setOpen(true);
  };

  const openEdit = (employee) => {
    setEditing(employee);
    setValues(toFormValues(employee));
    setErrors({});
    setModalError('');
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
  };

  const setField = (field, value) => {
    setValues((current) => ({...current, [field]: value}));
    setErrors((current) => ({...current, [field]: undefined}));
    setModalError('');
  };

  const saveRequest = (payload) => {
    if (isEdit) {
      return api.update(editing.id, payload);
    }
    return api.create(payload);
  };

  const submit = async (event) => {
    event?.preventDefault();
    const nextErrors = validateEmployee(values, {isEdit});
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    setSaving(true);
    try {
      const {employee} = await saveRequest(toPayload(values));
      setOpen(false);
      let message = `Se registró a ${employee.nombre} ${employee.apellido}`;
      if (isEdit) {
        message = `Se actualizaron los datos de ${employee.nombre} ${employee.apellido}`;
      }
      onSaved?.(message);
    }
    catch (requestError) {
      setModalError(requestError.message);
    }
    setSaving(false);
  };

  return {open, isEdit, values, errors, modalError, saving, openCreate, openEdit, close, setField, submit};
}
