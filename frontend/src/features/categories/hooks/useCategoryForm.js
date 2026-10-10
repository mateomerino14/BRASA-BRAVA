import {useRef, useState} from 'react';
import {categoriesApi} from '../services/categoriesApi';
import {EMPTY_FORM} from '../constants/categories';
import {toFormValues, toPayload, validateCategory} from '../utils/categoryForm';

// Estado de la imagen: archivo nuevo, URL guardada y si el usuario la quitó
const emptyImage = {file: null, url: null, removed: false};

export function useCategoryForm({onSaved, api = categoriesApi} = {}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState(EMPTY_FORM);
  const [image, setImage] = useState(emptyImage);
  const [errors, setErrors] = useState({});
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);
  const nextKey = useRef(0);
  const isEdit = Boolean(editing);

  const reset = (category) => {
    setEditing(category);
    let initialValues = EMPTY_FORM;
    if (category) {
      initialValues = toFormValues(category);
    }
    setValues(initialValues);
    setImage({...emptyImage, url: category?.imagenUrl ?? null});
    setErrors({});
    setModalError('');
    setOpen(true);
  };

  const setField = (field, value) => {
    setValues((current) => ({...current, [field]: value}));
    setErrors((current) => ({...current, [field]: undefined}));
    setModalError('');
  };

  const addSubcategory = (nombre) => {
    nextKey.current += 1;
    setField('subcategorias', [...values.subcategorias, {key: `nueva-${nextKey.current}`, nombre}]);
  };

  const removeSubcategory = (key) => {
    setField('subcategorias', values.subcategorias.filter((sub) => sub.key !== key));
  };

  const changeImage = (file) => {
    if (file) {
      setImage((current) => ({...current, file, removed: false}));
    }
    else {
      setImage((current) => ({...current, file: null, removed: true}));
    }
  };

  // Sube o quita la imagen después de guardar los datos
  const syncImage = async (category) => {
    if (image.file) {
      return (await api.uploadImage(category.id, image.file)).category;
    }
    if (image.removed && category.imagenUrl) {
      return (await api.removeImage(category.id)).category;
    }
    return category;
  };

  const saveRequest = (payload) => {
    if (isEdit) {
      return api.update(editing.id, payload);
    }
    return api.create(payload);
  };

  const submit = async (event) => {
    event?.preventDefault();
    const nextErrors = validateCategory(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    setSaving(true);
    let saved = null;
    try {
      saved = (await saveRequest(toPayload(values))).category;
      const category = await syncImage(saved);
      setOpen(false);
      let message = `Se registró la categoría ${category.nombre}`;
      if (isEdit) {
        message = `Se actualizó la categoría ${category.nombre}`;
      }
      onSaved?.(message);
    }
    catch (requestError) {
      if (saved) {
        // Los datos ya se guardaron: el siguiente intento solo modifica y vuelve a subir la imagen
        setEditing(saved);
        setModalError(`La categoría se guardó, pero la imagen no: ${requestError.message}`);
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
    values,
    image: {file: image.file, url: visibleImageUrl},
    errors,
    modalError,
    saving,
    openCreate: () => reset(null),
    openEdit: (category) => reset(category),
    close: () => setOpen(false),
    setField,
    addSubcategory,
    removeSubcategory,
    changeImage,
    submit,
  };
}
