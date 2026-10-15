import {useState} from 'react';
import {useToast} from '../../../context/useToast';
import {authApi} from '../services/authApi';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_PATTERN = /^\d{6}$/;
const minPasswordLength = 8;

export const passwordError = (password) => {
  if (password.length < minPasswordLength) {
    return `Debe tener al menos ${minPasswordLength} caracteres`;
  }
  if (!/[A-Za-z]/.test(password)) {
    return 'Debe incluir letras';
  }
  if (!/\d/.test(password)) {
    return 'Debe incluir números';
  }
  return '';
};

export function usePasswordReset({api = authApi} = {}) {
  const toast = useToast();
  const [step, setStep] = useState('closed');
  const [email, setEmailValue] = useState('');
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const run = async (work) => {
    setLoading(true);
    setErrors({});
    try {
      return await work();
    }
    catch (requestError) {
      toast.error(requestError.message);
      return undefined;
    }
    finally {
      setLoading(false);
    }
  };

  const restart = (nextStep) => {
    setStep(nextStep);
    setEmailValue('');
    setCode('');
    setErrors({});
    setNotice('');
  };

  const open = () => restart('email');

  const close = () => restart('closed');

  const setEmail = (value) => {
    setEmailValue(value);
    setErrors({});
  };

  const sendCode = async () => {
    if (!EMAIL_PATTERN.test(email.trim())) {
      setErrors({email: 'Ingrese un correo válido'});
      return;
    }
    const ok = await run(() => api.requestResetCode(email.trim()));
    if (ok) {
      setCode('');
      setStep('code');
      setNotice('Le enviamos un código de 6 dígitos. Revise su bandeja de entrada.');
    }
  };

  const resendCode = async () => {
    const ok = await run(() => api.requestResetCode(email.trim()));
    if (ok) {
      setCode('');
      setNotice('Le enviamos un código nuevo.');
    }
  };

  const verifyCode = async () => {
    if (!CODE_PATTERN.test(code)) {
      setErrors({code: 'Complete los 6 dígitos del código'});
      return;
    }
    setNotice('');
    const ok = await run(() => api.verifyResetCode(email.trim(), code));
    if (ok) {
      setStep('password');
    }
    else {
      setCode('');
    }
  };

  const savePassword = async (password, confirmation) => {
    const rule = passwordError(password);
    if (rule) {
      setErrors({password: rule});
      return;
    }
    if (password !== confirmation) {
      setErrors({confirmation: 'Las contraseñas no coinciden'});
      return;
    }
    const ok = await run(() => api.confirmPasswordReset(email.trim(), code, password));
    if (ok) {
      setStep('done');
    }
  };

  const changeCode = (value) => {
    setCode(value);
    setErrors({});
  };

  const clearErrors = () => setErrors({});

  return {
    step,
    email,
    code,
    errors,
    notice,
    loading,
    setEmail,
    changeCode,
    clearErrors,
    open,
    close,
    sendCode,
    resendCode,
    verifyCode,
    savePassword,
  };
}
