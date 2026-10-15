import {useState} from 'react';
import {useAuth} from '../../../context/useAuth';
import {useToast} from '../../../context/useToast';

export const DIRECTORIO_USERNAME = 'DIRECTORIO';

export function useLoginForm({onSuccess} = {}) {
  const {login} = useAuth();
  const toast = useToast();
  const [values, setValues] = useState({username: '', password: ''});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const isDirectorio = values.username.toUpperCase() === DIRECTORIO_USERNAME;

  const setField = (field, value) => {
    setValues((current) => ({...current, [field]: value}));
    setErrors((current) => ({...current, [field]: undefined}));
  };

  const validate = () => {
    const next = {};
    if (!values.username.trim()) {
      next.username = 'Ingrese su usuario';
    }
    if (!values.password) {
      next.password = 'Ingrese su contraseña';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event?.preventDefault();
    if (!validate()) {
      return;
    }
    setSubmitting(true);
    try {
      const user = await login(values.username.trim(), values.password);
      onSuccess?.(user);
    }
    catch (error) {
      toast.error(error.message, 'No se pudo ingresar');
      setValues((current) => ({...current, password: ''}));
    }
    finally {
      setSubmitting(false);
    }
  };

  const toggleDirectorio = () => {
    if (isDirectorio) {
      setField('username', '');
    }
    else {
      setField('username', DIRECTORIO_USERNAME);
    }
  };

  return {
    values,
    errors,
    submitting,
    isDirectorio,
    setField,
    submit,
    toggleDirectorio,
  };
}
