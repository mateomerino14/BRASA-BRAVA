import {useRef} from 'react';
import {Navigate, useLocation, useNavigate} from 'react-router';
import {motion} from 'motion/react';
import {AuthLayout} from '../../../components/templates/AuthLayout';
import {EmployeeCarousel} from '../../../components/organisms/EmployeeCarousel';
import {Logo} from '../../../components/atoms/Logo';
import {useAuth} from '../../../context/useAuth';
import {LoginForm} from '../components/LoginForm';
import {PasswordResetModal} from '../components/PasswordResetModal';
import {useLoginForm} from '../hooks/useLoginForm';
import {useLoginUsers} from '../hooks/useLoginUsers';
import {usePasswordReset} from '../hooks/usePasswordReset';

const styles = {
  content: 'mx-auto flex w-full max-w-xl flex-1 flex-col items-center gap-6 py-8',
  title: 'font-display text-6xl leading-none text-carbon',
};

const contentHidden = {opacity: 0, y: 20};
const contentVisible = {opacity: 1, y: 0};
const contentTransition = {duration: 0.4, ease: 'easeOut'};
const logoHidden = {scale: 0.8, rotate: -8, opacity: 0};
const logoVisible = {scale: 1, rotate: 0, opacity: 1};
const logoSpring = {type: 'spring', stiffness: 200, damping: 14, delay: 0.1};

export function LoginPage() {
  const {status} = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const passwordRef = useRef(null);
  const redirectTo = location.state?.from ?? '/';
  const form = useLoginForm({onSuccess: () => navigate(redirectTo, {replace: true})});
  const {users, loading} = useLoginUsers();
  const reset = usePasswordReset();

  if (status === 'authenticated') {
    return <Navigate to={redirectTo} replace />;
  }

  const selectUser = (user) => {
    form.setField('username', user.alias);
    passwordRef.current?.focus();
  };

  return (
    <AuthLayout>
      <EmployeeCarousel users={users} loading={loading} selectedAlias={form.values.username} onSelect={selectUser} />
      <motion.div initial={contentHidden} animate={contentVisible} transition={contentTransition} className={styles.content}>
        <h1 className={styles.title}>Inicio de sesión</h1>
        <motion.div initial={logoHidden} animate={logoVisible} transition={logoSpring}>
          <Logo size={170} glow />
        </motion.div>
        <LoginForm form={form} onForgotPassword={reset.open} passwordRef={passwordRef} />
      </motion.div>
      <PasswordResetModal reset={reset} />
    </AuthLayout>
  );
}
