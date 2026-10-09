import {useState} from 'react';
import {employeesApi} from '../services/employeesApi';

export function useEmployeeStatus({onChanged, api = employeesApi} = {}) {
  const [target, setTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const ask = (employee) => {
    setTarget(employee);
    setModalError('');
  };

  const cancel = () => {
    setTarget(null);
  };

  const confirm = async () => {
    if (!target) {
      return;
    }
    setSaving(true);
    try {
      const {employee} = await api.setStatus(target.id, !target.activo);
      setTarget(null);
      let message = `Se reactivó a ${employee.nombre} ${employee.apellido}`;
      if (!employee.activo) {
        message = `Se dio de baja a ${employee.nombre} ${employee.apellido}`;
      }
      onChanged?.(message);
    }
    catch (requestError) {
      setModalError(requestError.message);
    }
    setSaving(false);
  };

  return {target, saving, modalError, ask, cancel, confirm};
}
