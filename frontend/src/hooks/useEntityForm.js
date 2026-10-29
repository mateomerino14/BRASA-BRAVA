import {useState} from 'react';
import {useToast} from '../context/useToast';

const emptyImage = {file: null, url: null, removed: false};

const hasErrors = (errors) => Object.keys(errors).length > 0;

export function useEntityForm({api, entityKey, emptyValues, toFormValues, toPayload, validate, messages, onSaved, withImage = false, imageField = 'imagenUrl'}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState(emptyValues);
  const [image, setImage] = useState(emptyImage);
  const [errors, setErrors] = useState({});
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(editing);

  const reset = (entity) => {
    setEditing(entity);
    let initialValues = emptyValues;
    if (entity) {
      initialValues = toFormValues(entity);
    }
    setValues(initialValues);
    setImage({...emptyImage, url: entity?.[imageField] ?? null});
    setErrors({});
    setOpen(true);
  };

  const setFields = (changes, alsoClear = []) => {
    setValues((current) => ({...current, ...changes}));
    setErrors((current) => {
      const next = {...current};
      [...Object.keys(changes), ...alsoClear].forEach((field) => {
        delete next[field];
      });
      return next;
    });
  };

  const changeImage = (file) => {
    if (file) {
      setImage((current) => ({...current, file, removed: false}));
    }
    else {
      setImage((current) => ({...current, file: null, removed: true}));
    }
  };

  const syncImage = async (entity) => {
    if (!withImage) {
      return entity;
    }
    if (image.file) {
      return (await api.uploadImage(entity.id, image.file))[entityKey];
    }
    if (image.removed && entity[imageField]) {
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
    const nextErrors = validate(values, {isEdit, editing});
    let errorTitle = 'No se pudo registrar';
    if (isEdit) {
      errorTitle = 'No se pudo guardar';
    }
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
        setEditing(saved);
        toast.error(`${messages.imageFailed}: ${requestError.message}`, errorTitle);
        onSaved?.();
      }
      else {
        toast.error(requestError.message, errorTitle);
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
