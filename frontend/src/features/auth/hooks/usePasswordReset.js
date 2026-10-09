import {useState} from 'react';
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
  const [step, setStep] = useState('closed');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const run = async (work) => {
    setLoading(true);
    setError('');
    try {
      return await work();
    }
    catch (requestError) {
      setError(requestError.message);
      return undefined;
    }
    finally {
      setLoading(false);
    }
  };

  const open = () => {
    setStep('email');
    setCode('');
    setError('');
    setNotice('');
  };

  const close = () => {
    setStep('closed');
    setCode('');
    setError('');
    setNotice('');
  };

  const sendCode = async () => {
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Ingrese un correo válido');
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
      setError('Complete los 6 dígitos del código');
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
      setError(rule);
      return;
    }
    if (password !== confirmation) {
      setError('Las contraseñas no coinciden');
      return;
    }
    const ok = await run(() => api.confirmPasswordReset(email.trim(), code, password));
    if (ok) {
      setStep('done');
    }
  };

  const changeCode = (value) => {
    setCode(value);
    setError('');
  };

  return {
    step,
    email,
    code,
    error,
    notice,
    loading,
    setEmail,
    changeCode,
    open,
    close,
    sendCode,
    resendCode,
    verifyCode,
    savePassword,
  };
}
