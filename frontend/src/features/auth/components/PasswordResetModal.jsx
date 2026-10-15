import {useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {Ban, CircleCheck, Clock, Lock, TimerOff} from 'lucide-react';
import {Modal} from '../../../components/organisms/Modal';
import {Button} from '../../../components/atoms/Button';
import {Input} from '../../../components/atoms/Input';
import {PasswordInput} from '../../../components/atoms/PasswordInput';
import {FormField} from '../../../components/molecules/FormField';
import {CodeInput} from '../../../components/molecules/CodeInput';
import {Alert} from '../../../components/molecules/Alert';
import {useCountdown} from '../../../hooks/useCountdown';
import {cn} from '../../../lib/cn';
import {CODE_PROBLEMS, RESET_STEPS} from '../constants/resetSteps';

const styles = {
  form: 'flex flex-col gap-6',
  codeStep: 'flex flex-col gap-3',
  codeLabel: 'font-display text-2xl text-carbon',
  fieldError: 'text-sm font-medium text-error',
  codeMeta: 'flex flex-wrap items-center justify-between gap-2 text-sm font-medium text-cafe',
  timer: 'inline-flex items-center gap-1.5',
  urgent: 'text-error',
  problem: 'flex items-start gap-3 rounded-2xl border border-error/30 bg-error/5 p-4',
  problemIcon: 'flex size-10 shrink-0 items-center justify-center rounded-full bg-error text-white',
  problemTitle: 'font-display text-xl leading-tight text-error',
  problemText: 'text-sm font-medium text-carbon',
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
    <FormField label="Correo" error={reset.errors.email}>
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

const PROBLEM_ICONS = {bloqueado: Lock, vencido: TimerOff, invalido: Ban};
const SECONDS_PER_MINUTE = 60;
const URGENT_SECONDS = 60;
const LAST_ATTEMPT = 1;

const clockText = (seconds) => {
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  const rest = String(seconds % SECONDS_PER_MINUTE).padStart(2, '0');
  return `${minutes}:${rest}`;
};

function CodeProblem({status}) {
  const problem = CODE_PROBLEMS[status];
  const Icon = PROBLEM_ICONS[status];
  return (
    <motion.div initial={stepHidden} animate={stepVisible} role="status" className={styles.problem}>
      <span className={styles.problemIcon}>
        <Icon size={20} aria-hidden />
      </span>
      <div>
        <p className={styles.problemTitle}>{problem.title}</p>
        <p className={styles.problemText}>{problem.text}</p>
      </div>
    </motion.div>
  );
}

function CodeMeta({secondsLeft, attemptsLeft}) {
  if (secondsLeft === null && attemptsLeft === null) {
    return null;
  }
  return (
    <div className={styles.codeMeta}>
      {secondsLeft !== null && (
        <span className={cn(styles.timer, secondsLeft <= URGENT_SECONDS && styles.urgent)}>
          <Clock size={15} aria-hidden />
          Vence en {clockText(secondsLeft)}
        </span>
      )}
      {attemptsLeft !== null && (
        <span className={cn(attemptsLeft <= LAST_ATTEMPT && styles.urgent)}>
          {attemptsLeft === LAST_ATTEMPT ? 'Último intento' : `Le quedan ${attemptsLeft} intentos`}
        </span>
      )}
    </div>
  );
}

function CodeStep({reset, status, secondsLeft}) {
  const blocked = status !== 'activo';
  return (
    <div className={styles.codeStep}>
      <p className={styles.codeLabel}>Código</p>
      <CodeInput
        value={reset.code}
        onChange={reset.changeCode}
        invalid={Boolean(reset.errors.code)}
        disabled={blocked}
        focusOnMount
      />
      {blocked && <CodeProblem status={status} />}
      {!blocked && <CodeMeta secondsLeft={secondsLeft} attemptsLeft={reset.attemptsLeft} />}
      {!blocked && reset.errors.code && <p role="alert" className={styles.fieldError}>{reset.errors.code}</p>}
      {!blocked && !reset.errors.code && reset.notice && <Alert tone="info">{reset.notice}</Alert>}
    </div>
  );
}

function PasswordStep({reset, values, onChange}) {
  return (
    <div className={styles.passwordStep}>
      <FormField label="Nueva contraseña" hint="Mínimo 8 caracteres, con letras y números." error={reset.errors.password}>
        {(field) => (
          <PasswordInput
            {...field}
            autoComplete="new-password"
            value={values.password}
            onChange={(event) => onChange('password', event.target.value)}
          />
        )}
      </FormField>
      <FormField label="Confirmar contraseña" error={reset.errors.confirmation}>
        {(field) => (
          <PasswordInput
            {...field}
            autoComplete="new-password"
            value={values.confirmation}
            onChange={(event) => onChange('confirmation', event.target.value)}
          />
        )}
      </FormField>
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
  const secondsLeft = useCountdown(reset.expiresAt);
  let codeStatus = reset.codeStatus;
  if (codeStatus === 'activo' && secondsLeft === 0) {
    codeStatus = 'vencido';
  }
  const codeBlocked = reset.step === 'code' && codeStatus !== 'activo';

  const close = () => {
    setPasswords(emptyPasswords);
    reset.close();
  };

  const changePassword = (field, value) => {
    setPasswords((current) => ({...current, [field]: value}));
    reset.clearErrors();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (reset.step === 'email') {
      reset.sendCode();
    }
    else if (codeBlocked) {
      reset.resendCode();
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
    <Modal open={reset.step !== 'closed'} closeButton={false} onClose={close} title={step.title} description={step.description}>
      <form onSubmit={handleSubmit} noValidate className={styles.form}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={reset.step} initial={stepHidden} animate={stepVisible} exit={stepExit} transition={stepTransition}>
            {reset.step === 'email' && <EmailStep reset={reset} />}
            {reset.step === 'code' && <CodeStep reset={reset} status={codeStatus} secondsLeft={secondsLeft} />}
            {reset.step === 'password' && <PasswordStep reset={reset} values={passwords} onChange={changePassword} />}
            {reset.step === 'done' && <DoneStep />}
          </motion.div>
        </AnimatePresence>

        <div className={styles.actions}>
          {codeBlocked && (
            <Button type="button" fullWidth loading={reset.loading} onClick={reset.resendCode}>
              Reenviar código
            </Button>
          )}
          {!codeBlocked && (
            <Button type="submit" fullWidth loading={reset.loading}>
              {step.action}
            </Button>
          )}
          {reset.step === 'code' && !codeBlocked && (
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
