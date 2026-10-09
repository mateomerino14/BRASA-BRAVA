import {useRef} from 'react';
import {cn} from '../../lib/cn';

const styles = {
  group: 'flex justify-center gap-2 rounded-xl bg-hueso p-3 sm:gap-3',
  shake: 'animate-shake',
  digit: 'size-12 rounded-lg border bg-crema text-center font-display text-3xl text-carbon transition-[border-color,box-shadow,transform] duration-150 focus:-translate-y-0.5 focus:bg-white focus:outline-none focus:ring-4 sm:size-14',
  empty: 'border-carbon/40 focus:border-brasa focus:ring-brasa/20',
  filled: 'border-brasa focus:ring-brasa/20',
  invalid: 'border-rojo focus:ring-rojo/15',
};

const getDigitStyle = (digit, invalid) => {
  if (invalid) {
    return styles.invalid;
  }
  if (digit) {
    return styles.filled;
  }
  return styles.empty;
};

export function CodeInput({value, onChange, length = 6, invalid = false, disabled = false, focusOnMount = false}) {
  const refs = useRef([]);
  const digits = Array.from({length}, (_, index) => (value[index] ?? '').trim());

  // Los huecos se guardan como espacio para que borrar un dígito no corra los siguientes
  const emit = (next) => {
    const text = next.map((digit) => digit || ' ').join('').trimEnd();
    onChange(text);
  };

  const focusAt = (index) => {
    const safeIndex = Math.max(0, Math.min(index, length - 1));
    refs.current[safeIndex]?.focus();
  };

  const writeFrom = (index, text) => {
    const clean = text.replace(/\D/g, '');
    if (!clean) {
      return;
    }
    const next = digits.slice();
    clean.slice(0, length - index).split('').forEach((digit, offset) => {
      next[index + offset] = digit;
    });
    emit(next);
    focusAt(index + clean.length);
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      const next = digits.slice();
      if (next[index]) {
        next[index] = '';
      }
      else if (index > 0) {
        next[index - 1] = '';
        focusAt(index - 1);
      }
      emit(next);
    }
    else if (event.key === 'ArrowLeft') {
      focusAt(index - 1);
    }
    else if (event.key === 'ArrowRight') {
      focusAt(index + 1);
    }
  };

  const handlePaste = (index, event) => {
    event.preventDefault();
    writeFrom(index, event.clipboardData.getData('text'));
  };

  return (
    <div role="group" aria-label="Código de verificación" className={cn(styles.group, invalid && styles.shake)}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element;
          }}
          value={digit}
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          // eslint-disable-next-line jsx-a11y/no-autofocus -- el modal de verificación lleva al usuario directo al código
          autoFocus={focusOnMount && index === 0}
          aria-label={`Dígito ${index + 1}`}
          aria-invalid={invalid || undefined}
          onChange={(event) => writeFrom(index, event.target.value.slice(-1))}
          onPaste={(event) => handlePaste(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onFocus={(event) => event.target.select()}
          className={cn(styles.digit, getDigitStyle(digit, invalid))}
        />
      ))}
    </div>
  );
}
