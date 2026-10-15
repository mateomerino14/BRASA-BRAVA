import {createContext} from 'react';

// Contexto de avisos emergentes; el proveedor está en ToastContext.jsx y el acceso en useToast.js.
export const ToastContext = createContext(null);
