import {useEffect, useState} from 'react';
import {authApi} from '../services/authApi';

export function useLoginUsers({api = authApi} = {}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await api.loginUsers();
        if (!cancelled) {
          setUsers(data.users);
        }
      }
      catch {
        // Si la lista falla, el login sigue funcionando escribiendo el usuario
        if (!cancelled) {
          setUsers([]);
        }
      }
      if (!cancelled) {
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [api]);

  return {users, loading};
}
