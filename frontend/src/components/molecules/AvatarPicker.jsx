import {useId, useState} from 'react';
import {Camera, Trash2} from 'lucide-react';
import {Avatar} from '../atoms/Avatar';
import {useImagePreview} from '../../hooks/useImagePreview';
import {ACCEPTED_IMAGE_TYPES, DEFAULT_MAX_MB, validateImageFile} from '../../lib/imageFile';

const styles = {
  root: 'flex shrink-0 flex-col items-center gap-1.5',
  frame: 'relative',
  ring: 'rounded-full ring-4 ring-white shadow-card',
  badge: 'absolute -bottom-1 -right-1 inline-flex size-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-brasa text-white shadow-pill transition-[background-color,transform] duration-200 hover:bg-brasa-oscuro peer-focus-visible:ring-4 peer-focus-visible:ring-brasa/30 active:scale-95',
  remove: 'inline-flex items-center gap-1 text-xs font-semibold text-cafe transition-colors hover:text-rojo',
  input: 'peer sr-only',
  error: 'max-w-32 text-center text-xs font-medium text-error',
};

export function AvatarPicker({name, label = 'Foto', file = null, url = null, onChange, size = 72, maxMb = DEFAULT_MAX_MB}) {
  const inputId = useId();
  const [error, setError] = useState('');
  const preview = useImagePreview(file, url);

  const pick = (selected) => {
    if (!selected) {
      return;
    }
    const problem = validateImageFile(selected, maxMb);
    setError(problem);
    if (!problem) {
      onChange(selected);
    }
  };

  const remove = () => {
    setError('');
    onChange(null);
  };

  let badgeTitle = 'Agregar foto';
  if (preview) {
    badgeTitle = 'Cambiar foto';
  }

  return (
    <div className={styles.root}>
      <div className={styles.frame}>
        <Avatar name={name} src={preview} size={size} className={styles.ring} />
        <input
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
        <label htmlFor={inputId} title={badgeTitle} className={styles.badge}>
          <Camera size={15} aria-hidden />
        </label>
      </div>
      {preview && (
        <button type="button" onClick={remove} className={styles.remove}>
          <Trash2 size={12} aria-hidden /> Quitar foto
        </button>
      )}
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </div>
  );
}
