import {createContext} from 'react';

// Contexto de sesión; el proveedor está en AuthContext.jsx y el acceso en useAuth.js.
export const AuthContext = createContext(null);
