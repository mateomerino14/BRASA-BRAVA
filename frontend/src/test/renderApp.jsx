import {useEffect} from 'react';
import {render} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter, useLocation} from 'react-router';
import {MotionConfig} from 'motion/react';
import {AuthProvider} from '../context/AuthContext';
import {AppRoutes} from '../router/AppRoutes';

// Registra la ubicación actual para que las pruebas lean la URL (búsqueda, filtros, página)
function LocationSpy({onChange}) {
  const location = useLocation();
  useEffect(() => {
    onChange(location);
  }, [location, onChange]);
  return null;
}

export const renderApp = (route = '/', {token} = {}) => {
  if (token) {
    localStorage.setItem('brasa.token', token);
  }
  const user = userEvent.setup();
  const location = {current: null};
  const trackLocation = (next) => {
    location.current = next;
  };
  const result = render(
    <MotionConfig reducedMotion="always">
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>
          <AppRoutes />
          <LocationSpy onChange={trackLocation} />
        </AuthProvider>
      </MemoryRouter>
    </MotionConfig>,
  );
  return {user, location, ...result};
};
