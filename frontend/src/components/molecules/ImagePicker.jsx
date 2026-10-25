import {useId, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {ImagePlus, RefreshCw, Trash2} from 'lucide-react';
import {cn} from '../../lib/cn';
import {useImagePreview} from '../../hooks/useImagePreview';
import {ACCEPTED_IMAGE_TYPES, DEFAULT_MAX_MB, validateImageFile} from '../../lib/imageFile';

const styles = {
  zone: 'group relative flex h-44 w-full cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed bg-campo text-center transition-[border-color,background-color] duration-200',
  idle: 'border-arena hover:border-brasa hover:bg-brasa/5',
  dragging: 'border-brasa bg-brasa/10',
  invalid: 'border-error',
  icon: 'text-brasa transition-transform duration-300 group-hover:-translate-y-1',
  title: 'text-sm font-semibold text-carbon',
  hint: 'text-xs text-cafe',
  preview: 'absolute inset-0 size-full object-cover',
  overlay: 'absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-carbon/80 to-transparent p-3',
  action: 'inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-carbon shadow-pill transition-colors hover:bg-white',
  remove: 'text-rojo',
  fillRoot: 'flex min-h-0 flex-1 flex-col',
  fillZone: 'md:h-auto md:min-h-32 md:flex-1',
  input: 'sr-only',
  error: 'text-sm font-medium text-error',
};

const fadeIn = {opacity: 0, scale: 1.04};
const fadeVisible = {opacity: 1, scale: 1};

export function ImagePicker({label = 'Imagen', file = null, url = null, onChange, maxMb = DEFAULT_MAX_MB, error, fill = false, className}) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState('');
  const preview = useImagePreview(file, url);
  const message = localError || error;

  const pick = (selected) => {
    if (!selected) {
      return;
    }
    const problem = validateImageFile(selected, maxMb);
    setLocalError(problem);
    if (!problem) {
      onChange(selected);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    pick(event.dataTransfer.files?.[0]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragging(true);
  };

  const remove = (event) => {
    event.preventDefault();
    setLocalError('');
    onChange(null);
  };

  const replace = (event) => {
    event.preventDefault();
    inputRef.current?.click();
  };

  let zoneState = styles.idle;
  if (dragging) {
    zoneState = styles.dragging;
  }
  else if (message) {
    zoneState = styles.invalid;
  }

  return (
    <div className={cn(fill && styles.fillRoot, className)}>
      <label
        htmlFor={inputId}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(styles.zone, fill && styles.fillZone, zoneState)}
      >
        <ImagePlus size={30} aria-hidden className={styles.icon} />
        <span className={styles.title}>Arrastre una foto o haga clic para elegirla</span>
        <span className={styles.hint}>PNG, JPG o WEBP · máximo {maxMb} MB</span>
        <AnimatePresence>
          {preview && (
            <motion.img key={preview} src={preview} alt={`Vista previa de ${label.toLowerCase()}`} initial={fadeIn} animate={fadeVisible} exit={{opacity: 0}} className={styles.preview} />
          )}
        </AnimatePresence>
        {preview && (
          <span className={styles.overlay}>
            <button type="button" onClick={replace} className={styles.action}>
              <RefreshCw size={13} aria-hidden /> Cambiar
            </button>
            <button type="button" onClick={remove} className={cn(styles.action, styles.remove)}>
              <Trash2 size={13} aria-hidden /> Quitar
            </button>
          </span>
        )}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        aria-label={label}
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        className={styles.input}
        onChange={(event) => {
          pick(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      {message && <p role="alert" className={styles.error}>{message}</p>}
    </div>
  );
}
