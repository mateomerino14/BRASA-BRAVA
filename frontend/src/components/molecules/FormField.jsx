import {useId} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {cn} from '../../lib/cn';

const styles = {
  field: 'flex flex-col gap-1.5',
  label: 'text-base font-semibold text-carbon',
  required: 'text-rojo',
  message: 'text-sm',
  error: 'text-rojo',
  hint: 'text-cafe',
};

const messageHidden = {opacity: 0, y: -4};
const messageVisible = {opacity: 1, y: 0};

export function FormField({label, error, hint, required = false, className, children}) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error || hint;

  let control = children;
  if (typeof children === 'function') {
    control = children({id, 'aria-describedby': message ? messageId : undefined, invalid: Boolean(error)});
  }

  return (
    <div className={cn(styles.field, className)}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && <span className={styles.required}> *</span>}
      </label>
      {control}
      <AnimatePresence initial={false} mode="wait">
        {message && (
          <motion.p
            key={error ? 'error' : 'hint'}
            id={messageId}
            initial={messageHidden}
            animate={messageVisible}
            exit={messageHidden}
            className={cn(styles.message, error ? styles.error : styles.hint)}
            role={error ? 'alert' : undefined}
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
