import {use} from 'react';
import {AuthContext} from './authContextValue';

export const useAuth = () => {
  const context = use(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return context;
};
