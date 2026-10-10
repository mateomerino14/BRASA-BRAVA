import {useState} from 'react';
import {ingredientsApi} from '../services/ingredientsApi';
import {EMPTY_MOVEMENT, MOVEMENT_DONE} from '../constants/stock';
import {previewStock, toMovementPayload, validateMovement} from '../utils/stockForm';
import {formatQuantity} from '../../../lib/format';

// Registro de una entrada, salida o ajuste para el insumo elegido
export function useStockMovement({onSaved, api = ingredientsApi} = {}) {
  const [target, setTarget] = useState(null);
  const [values, setValues] = useState(EMPTY_MOVEMENT);
  const [errors, setErrors] = useState({});
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  const open = (ingredient, tipo = EMPTY_MOVEMENT.tipo) => {
    setTarget(ingredient);
    setValues({...EMPTY_MOVEMENT, tipo});
    setErrors({});
    setModalError('');
  };

  const setField = (field, value) => {
    setValues((current) => ({...current, [field]: value}));
    setErrors({});
    setModalError('');
  };

  const submit = async (event) => {
    event?.preventDefault();
    const nextErrors = validateMovement(values);
    if (!nextErrors.cantidad && previewStock(target.stockActual, values) < 0) {
      nextErrors.cantidad = 'No hay suficiente stock para esa salida';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    setSaving(true);
    try {
      const {ingredient} = await api.addMovement(target.id, toMovementPayload(values));
      setTarget(null);
      onSaved?.(`${MOVEMENT_DONE[values.tipo]}: ${ingredient.nombre} queda con ${formatQuantity(ingredient.stockActual, ingredient.unidad)}`);
    }
    catch (requestError) {
      setModalError(requestError.message);
    }
    setSaving(false);
  };

  let preview = null;
  if (target) {
    preview = previewStock(target.stockActual, values);
  }

  return {target, values, errors, modalError, saving, preview, open, close: () => setTarget(null), setField, submit};
}
