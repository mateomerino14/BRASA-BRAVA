import {useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {CircleCheck} from 'lucide-react';
import {Modal} from '../../../components/organisms/Modal';
import {Button} from '../../../components/atoms/Button';
import {Input} from '../../../components/atoms/Input';
import {PasswordInput} from '../../../components/atoms/PasswordInput';
import {FormField} from '../../../components/molecules/FormField';
import {CodeInput} from '../../../components/molecules/CodeInput';
import {Alert} from '../../../components/molecules/Alert';
import {RESET_STEPS} from '../constants/resetSteps';

const styles = {
  form: 'flex flex-col gap-6',
  codeStep: 'flex flex-col gap-3',
  codeLabel: 'font-display text-2xl text-carbon',
  passwordStep: 'flex flex-col gap-4',
  success: 'flex justify-center py-4 text-verde',
  actions: 'flex flex-col gap-3',
};

const emptyPasswords = {password: '', confirmation: ''};
const stepHidden = {opacity: 0, x: 24};
const stepVisible = {opacity: 1, x: 0};
const stepExit = {opacity: 0, x: -24};
const stepTransition = {duration: 0.2};
const checkHidden = {scale: 0.6, rotate: -20};
const checkVisible = {scale: 1, rotate: 0};
const checkSpring = {type: 'spring', stiffness: 260, damping: 14};

function EmailStep({reset}) {
  return (
    <FormField label="Correo" error={reset.error}>
      {(field) => (
        <Input
          {...field}
          type="email"
          autoComplete="email"
          placeholder="nombre@brasabrava.bo"
          value={reset.email}
          onChange={(event) => reset.setEmail(event.target.value)}
        />
      )}
    </FormField>
  );
}

function CodeStep({reset}) {
  return (
    <div className={styles.codeStep}>
      <p className={styles.codeLabel}>Código</p>
      <CodeInput value={reset.code} onChange={reset.changeCode} invalid={Boolean(reset.error)} focusOnMount />
      {reset.error && <Alert tone="error">{reset.error}</Alert>}
      {!reset.error && reset.notice && <Alert tone="info">{reset.notice}</Alert>}
    </div>
  );
}

function PasswordStep({reset, values, onChange}) {
  return (
    <div className={styles.passwordStep}>
      <FormField label="Nueva contraseña" hint="Mínimo 8 caracteres, con letras y números.">
        {(field) => (
          <PasswordInput
            {...field}
            autoComplete="new-password"
            value={values.password}
            onChange={(event) => onChange('password', event.target.value)}
          />
        )}
      </FormField>
      <FormField label="Confirmar contraseña">
        {(field) => (
          <PasswordInput
            {...field}
            autoComplete="new-password"
            value={values.confirmation}
            onChange={(event) => onChange('confirmation', event.target.value)}
          />
        )}
      </FormField>
      {reset.error && <Alert tone="error">{reset.error}</Alert>}
    </div>
  );
}

function DoneStep() {
  return (
    <motion.div initial={checkHidden} animate={checkVisible} transition={checkSpring} className={styles.success}>
      <CircleCheck size={72} strokeWidth={1.6} aria-hidden />
    </motion.div>
  );
}

export function PasswordResetModal({reset}) {
  const [passwords, setPasswords] = useState(emptyPasswords);
  const step = RESET_STEPS[reset.step] ?? RESET_STEPS.email;

  const close = () => {
    setPasswords(emptyPasswords);
    reset.close();
  };

  const changePassword = (field, value) => {
    setPasswords((current) => ({...current, [field]: value}));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (reset.step === 'email') {
      reset.sendCode();
    }
    else if (reset.step === 'code') {
      reset.verifyCode();
    }
    else if (reset.step === 'password') {
      reset.savePassword(passwords.password, passwords.confirmation);
    }
    else if (reset.step === 'done') {
      close();
    }
  };

  return (
    <Modal open={reset.step !== 'closed'} onClose={close} title={step.title} description={step.description}>
      <form onSubmit={handleSubmit} noValidate className={styles.form}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={reset.step} initial={stepHidden} animate={stepVisible} exit={stepExit} transition={stepTransition}>
            {reset.step === 'email' && <EmailStep reset={reset} />}
            {reset.step === 'code' && <CodeStep reset={reset} />}
            {reset.step === 'password' && <PasswordStep reset={reset} values={passwords} onChange={changePassword} />}
            {reset.step === 'done' && <DoneStep />}
          </motion.div>
        </AnimatePresence>

        <div className={styles.actions}>
          <Button type="submit" fullWidth loading={reset.loading}>
            {step.action}
          </Button>
          {reset.step === 'code' && (
            <Button type="button" fullWidth variant="outline" disabled={reset.loading} onClick={reset.resendCode}>
              Reenviar código
            </Button>
          )}
          {reset.step !== 'done' && (
            <Button type="button" fullWidth variant="danger" onClick={close}>
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
