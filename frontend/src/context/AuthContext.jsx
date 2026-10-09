import {useCallback, useEffect, useMemo, useState} from 'react';
import {authApi} from '../features/auth/services/authApi';
import {setUnauthorizedHandler, tokenStorage} from '../lib/apiClient';
import {AuthContext} from './authContextValue';

const getInitialStatus = () => {
  if (tokenStorage.get()) {
    return 'checking';
  }
  return 'anonymous';
};

export function AuthProvider({children, api = authApi}) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(getInitialStatus);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    setStatus('anonymous');
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!tokenStorage.get()) {
      return;
    }
    let cancelled = false;
    api
      .me()
      .then(({user: profile}) => {
        if (cancelled) {
          return;
        }
        setUser(profile);
        setStatus('authenticated');
      })
      .catch(() => !cancelled && logout());
    return () => {
      cancelled = true;
    };
  }, [api, logout]);

  const login = useCallback(
    async (username, password) => {
      const session = await api.login(username, password);
      tokenStorage.set(session.token);
      setUser(session.user);
      setStatus('authenticated');
      return session.user;
    },
    [api],
  );

  const value = useMemo(() => ({user, status, login, logout}), [user, status, login, logout]);
  return <AuthContext value={value}>{children}</AuthContext>;
}
