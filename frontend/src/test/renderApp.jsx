import {render} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router';
import {MotionConfig} from 'motion/react';
import {AuthProvider} from '../context/AuthContext';
import {AppRoutes} from '../router/AppRoutes';

export const renderApp = (route = '/', {token} = {}) => {
  if (token) {
    localStorage.setItem('brasa.token', token);
  }
  const user = userEvent.setup();
  const result = render(
    <MotionConfig reducedMotion="always">
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>
    </MotionConfig>,
  );
  return {user, ...result};
};
