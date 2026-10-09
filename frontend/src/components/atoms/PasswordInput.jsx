import {useState} from 'react';
import {Eye, EyeOff} from 'lucide-react';
import {Input} from './Input';

const styles = {
  wrapper: 'relative',
  input: 'pr-12',
  toggle: 'absolute inset-y-0 right-2 my-auto flex size-9 items-center justify-center rounded-md text-carbon/70 transition hover:bg-hueso hover:text-brasa',
};

export function PasswordInput({ref, ...props}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.wrapper}>
      <Input ref={ref} type={visible ? 'text' : 'password'} className={styles.input} {...props} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        className={styles.toggle}
      >
        {visible ? <Eye size={20} /> : <EyeOff size={20} />}
      </button>
    </div>
  );
}
