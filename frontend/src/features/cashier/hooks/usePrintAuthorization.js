import {useCallback, useRef, useState} from 'react';
import {cashierApi} from '../services/cashierApi';
import {useToast} from '../../../context/useToast';

const emptyValues = {alias: '', contrasena: ''};

// Cuenta cada impresión del ticket en el servidor. Las tres primeras salen directo; desde la cuarta
// pide el usuario y la contraseña de un empleado con acceso a Caja (queda registrado) y la impresión espera esa respuesta
export function usePrintAuthorization({api = cashierApi} = {}) {
  const toast = useToast();
  const resolverRef = useRef(null);
  const [request, setRequest] = useState(null);
  const [values, setValues] = useState(emptyValues);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const finish = (allowed) => {
    resolverRef.current?.(allowed);
    resolverRef.current = null;
    setRequest(null);
  };

  const authorize = useCallback(async (ticket) => {
    try {
      await api.registerPrint(ticket.id, {});
      return true;
    }
    catch (problem) {
      if (problem.body?.motivo !== 'autorizacion') {
        toast.error(problem.message, 'No se pudo imprimir');
        return false;
      }
      setValues(emptyValues);
      setErrors({});
      setRequest({ticket, message: problem.message, impresiones: problem.body.impresiones ?? []});
      return new Promise((resolve) => {
        resolverRef.current = resolve;
      });
    }
  }, [api, toast]);

  const change = (changes) => {
    setValues((current) => ({...current, ...changes}));
    setErrors({});
  };

  const confirm = async () => {
    const missing = {};
    if (!values.alias.trim()) {
      missing.alias = 'Ingrese el usuario de quien autoriza';
    }
    if (!values.contrasena) {
      missing.contrasena = 'Ingrese su contraseña';
    }
    if (Object.keys(missing).length > 0) {
      setErrors(missing);
      return;
    }
    setSaving(true);
    try {
      await api.registerPrint(request.ticket.id, {alias: values.alias.trim(), contrasena: values.contrasena});
      finish(true);
    }
    catch (problem) {
      const field = problem.body?.campo;
      if (field) {
        setErrors({[field]: problem.message});
      }
      else {
        toast.error(problem.message, 'No se pudo autorizar');
      }
    }
    finally {
      setSaving(false);
    }
  };

  return {request, values, errors, saving, authorize, change, confirm, cancel: () => finish(false)};
}
