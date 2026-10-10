import {useState} from 'react';

// Estado de la foto: archivo nuevo, URL guardada y si el usuario la quitó
const emptyImage = {file: null, url: null, removed: false};

const hasErrors = (errors) => Object.keys(errors).length > 0;

// Formulario estándar de registro y modificación: valores, validación, guardado, foto opcional y avisos.
// "api" necesita create/update y, si el módulo tiene foto, uploadImage/removeImage; "entityKey" es la clave de la respuesta.
export function useEntityForm({api, entityKey, emptyValues, toFormValues, toPayload, validate, messages, onSaved, withImage = false}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState(emptyValues);
  const [image, setImage] = useState(emptyImage);
  const [errors, setErrors] = useState({});
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(editing);

  const reset = (entity) => {
    setEditing(entity);
    let initialValues = emptyValues;
    if (entity) {
      initialValues = toFormValues(entity);
    }
    setValues(initialValues);
    setImage({...emptyImage, url: entity?.imagenUrl ?? null});
    setErrors({});
    setModalError('');
    setOpen(true);
  };

  // Cambia varios campos a la vez y limpia sus errores
  const setFields = (changes) => {
    setValues((current) => ({...current, ...changes}));
    setErrors((current) => {
      const next = {...current};
      Object.keys(changes).forEach((field) => {
        delete next[field];
      });
      return next;
    });
    setModalError('');
  };

  const changeImage = (file) => {
    if (file) {
      setImage((current) => ({...current, file, removed: false}));
    }
    else {
      setImage((current) => ({...current, file: null, removed: true}));
    }
  };

  // Sube o quita la foto después de guardar los datos
  const syncImage = async (entity) => {
    if (!withImage) {
      return entity;
    }
    if (image.file) {
      return (await api.uploadImage(entity.id, image.file))[entityKey];
    }
    if (image.removed && entity.imagenUrl) {
      return (await api.removeImage(entity.id))[entityKey];
    }
    return entity;
  };

  const saveRequest = (payload) => {
    if (isEdit) {
      return api.update(editing.id, payload);
    }
    return api.create(payload);
  };

  const submit = async (event) => {
    event?.preventDefault();
    const nextErrors = validate(values, {isEdit});
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      return;
    }
    setSaving(true);
    let saved = null;
    try {
      saved = (await saveRequest(toPayload(values, {isEdit})))[entityKey];
      const entity = await syncImage(saved);
      setOpen(false);
      let message = messages.created(entity);
      if (isEdit) {
        message = messages.updated(entity);
      }
      onSaved?.(message);
    }
    catch (requestError) {
      if (saved) {
        // Los datos ya se guardaron: el siguiente intento modifica en vez de duplicar y vuelve a subir la foto
        setEditing(saved);
        setModalError(`${messages.imageFailed}: ${requestError.message}`);
        onSaved?.();
      }
      else {
        setModalError(requestError.message);
      }
    }
    setSaving(false);
  };

  let visibleImageUrl = image.url;
  if (image.removed) {
    visibleImageUrl = null;
  }

  return {
    open,
    isEdit,
    editing,
    values,
    image: {file: image.file, url: visibleImageUrl},
    errors,
    modalError,
    saving,
    openCreate: () => reset(null),
    openEdit: (entity) => reset(entity),
    close: () => setOpen(false),
    setField: (field, value) => setFields({[field]: value}),
    setFields,
    changeImage,
    submit,
  };
}
