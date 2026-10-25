import {useState} from 'react';
import {authApi} from '../services/authApi';
import {passwordError} from './usePasswordReset';
import {useToast} from '../../../context/useToast';

const EMPTY = {actual: '', nueva: '', confirmacion: ''};

const validate = (values) => {
  const errors = {};
  if (!values.actual) {
    errors.actual = 'Ingrese la contraseña actual';
  }
  const rule = passwordError(values.nueva);
  if (rule) {
    errors.nueva = rule;
  }
  else if (values.nueva === values.actual) {
    errors.nueva = 'La nueva contraseña debe ser distinta de la actual';
  }
  if (!values.confirmacion) {
    errors.confirmacion = 'Repita la nueva contraseña';
  }
  else if (values.confirmacion !== values.nueva) {
    errors.confirmacion = 'Las contraseñas no coinciden';
  }
  return errors;
};

export function useDirectorioPassword({api = authApi} = {}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const show = () => {
    setValues(EMPTY);
    setErrors({});
    setOpen(true);
  };

  const setField = (field, value) => {
    setValues((current) => ({...current, [field]: value}));
    setErrors((current) => {
      const next = {...current};
      delete next[field];
      return next;
    });
  };

  const submit = async (event) => {
    event?.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    setSaving(true);
    try {
      await api.changeDirectorioPassword(values);
      setOpen(false);
      toast.success('Se cambió la contraseña del DIRECTORIO. Úsela la próxima vez que ingrese');
    }
    catch (requestError) {
      if (requestError.body?.campo === 'actual') {
        setErrors({actual: requestError.message});
      }
      else {
        toast.error(requestError.message, 'No se pudo cambiar la contraseña');
      }
    }
    setSaving(false);
  };

  return {open, values, errors, saving, show, close: () => setOpen(false), setField, submit};
}
