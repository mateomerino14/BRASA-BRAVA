import {BrowserRouter} from 'react-router';
import {MotionConfig} from 'motion/react';
import {AuthProvider} from './context/AuthContext';
import {AppRoutes} from './router/AppRoutes';

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </MotionConfig>
  );
}
