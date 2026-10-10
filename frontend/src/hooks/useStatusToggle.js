import {useState} from 'react';

// Confirmación de baja/reactivación: guarda el registro elegido, ejecuta el cambio y avisa el resultado
export function useStatusToggle({request, successMessage, onChanged}) {
  const [target, setTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const ask = (item) => {
    setTarget(item);
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
      const updated = await request(target);
      setTarget(null);
      onChanged?.(successMessage(updated));
    }
    catch (requestError) {
      setModalError(requestError.message);
    }
    setSaving(false);
  };

  return {target, saving, modalError, ask, cancel, confirm};
}
