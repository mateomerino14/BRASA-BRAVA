import {BrowserRouter} from 'react-router';
import {MotionConfig} from 'motion/react';
import {AuthProvider} from './context/AuthContext';
import {ToastProvider} from './context/ToastContext';
import {AppRoutes} from './router/AppRoutes';

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </MotionConfig>
  );
}
