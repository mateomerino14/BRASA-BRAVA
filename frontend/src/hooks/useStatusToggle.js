import {useState} from 'react';
import {useToast} from '../context/useToast';

export function useStatusToggle({request, successMessage, onChanged}) {
  const [target, setTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const ask = (item) => {
    setTarget(item);
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
      toast.error(requestError.message, 'No se pudo cambiar el estado');
    }
    setSaving(false);
  };

  return {target, saving, ask, cancel, confirm};
}
