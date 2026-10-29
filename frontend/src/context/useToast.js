import {use} from 'react';
import {ToastContext} from './toastContextValue';

export const useToast = () => {
  const context = use(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de <ToastProvider>');
  }
  return context;
};
