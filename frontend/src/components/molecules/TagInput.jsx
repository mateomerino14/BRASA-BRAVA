import {useId, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {Plus, X} from 'lucide-react';
import {cn} from '../../lib/cn';

const styles = {
  box: 'flex min-h-12 flex-wrap items-center gap-2 rounded-lg border bg-campo px-3 py-2 transition-[border-color,box-shadow] duration-200 focus-within:ring-4',
  normal: 'border-arena focus-within:border-brasa focus-within:ring-brasa/20',
  invalid: 'border-rojo focus-within:ring-rojo/15',
  chip: 'inline-flex items-center gap-1 rounded-full border border-brasa/40 bg-brasa/10 py-1 pl-3 pr-1 text-sm font-semibold text-carbon',
  chipRemove: 'flex size-5 items-center justify-center rounded-full text-cafe transition-colors hover:bg-rojo hover:text-white',
  input: 'min-w-36 flex-1 bg-transparent py-1 text-base text-carbon placeholder:text-cafe/60 focus:outline-none',
  add: 'flex size-7 items-center justify-center rounded-md bg-brasa text-white transition-colors hover:bg-brasa-oscuro disabled:opacity-40',
  footer: 'mt-1 flex justify-between text-xs text-cafe',
  warning: 'text-rojo',
};

const chipIn = {opacity: 0, scale: 0.6};
const chipVisible = {opacity: 1, scale: 1};
const chipSpring = {type: 'spring', stiffness: 500, damping: 30};
const SEPARATOR_KEYS = ['Enter', ','];

// Lista editable de etiquetas: Enter o coma agrega, Retroceso en vacío borra la última
export function TagInput({tags, onAdd, onRemove, max, placeholder = 'Escriba y presione Enter', invalid = false, id, 'aria-describedby': describedBy, className}) {
  const fallbackId = useId();
  const [draft, setDraft] = useState('');
  const [warning, setWarning] = useState('');
  const full = Boolean(max) && tags.length >= max;

  const commit = () => {
    const label = draft.trim();
    if (!label) {
      return;
    }
    if (tags.some((tag) => tag.label.toLowerCase() === label.toLowerCase())) {
      setWarning(`"${label}" ya está en la lista`);
      return;
    }
    if (full) {
      setWarning(`Máximo ${max} elementos`);
      return;
    }
    onAdd(label);
    setDraft('');
    setWarning('');
  };

  const handleKeyDown = (event) => {
    if (SEPARATOR_KEYS.includes(event.key)) {
      event.preventDefault();
      commit();
    }
    else if (event.key === 'Backspace' && !draft && tags.length > 0) {
      onRemove(tags.at(-1).key);
    }
  };

  return (
    <div className={className}>
      <div className={cn(styles.box, invalid ? styles.invalid : styles.normal)}>
        <AnimatePresence initial={false}>
          {tags.map((tag) => (
            <motion.span key={tag.key} layout initial={chipIn} animate={chipVisible} exit={chipIn} transition={chipSpring} className={styles.chip}>
              {tag.label}
              <button type="button" aria-label={`Quitar ${tag.label}`} onClick={() => onRemove(tag.key)} className={styles.chipRemove}>
                <X size={12} aria-hidden />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        <input
          id={id ?? fallbackId}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          value={draft}
          placeholder={placeholder}
          onChange={(event) => {
            setDraft(event.target.value);
            setWarning('');
          }}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          className={styles.input}
        />
        <button type="button" aria-label="Agregar" onClick={commit} disabled={!draft.trim()} className={styles.add}>
          <Plus size={15} aria-hidden />
        </button>
      </div>
      <div className={styles.footer}>
        <span className={styles.warning} role={warning ? 'alert' : undefined}>{warning}</span>
        {max && <span>{tags.length}/{max}</span>}
      </div>
    </div>
  );
}
