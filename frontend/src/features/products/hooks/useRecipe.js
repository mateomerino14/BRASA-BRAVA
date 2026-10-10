import {useRef, useState} from 'react';
import {productsApi} from '../services/productsApi';
import {computePortions, toRecipePayload, validateRecipe} from '../utils/recipeForm';

const toText = (value) => String(value).replace('.', ',');

// Une los insumos activos con los de la receta (que pueden estar de baja) para mostrar nombre, unidad y stock
const indexIngredients = (options, recipeItems) => {
  const byId = new Map(options.map((item) => [String(item.id), {...item, activo: true}]));
  for (const item of recipeItems) {
    if (!byId.has(String(item.idInsumo))) {
      byId.set(String(item.idInsumo), {id: item.idInsumo, nombre: item.nombre, unidad: item.unidad, stockActual: item.stockActual, activo: item.activo});
    }
  }
  return byId;
};

// Edición de la receta de un producto: filas de insumo y cantidad, porciones en vivo y guardado completo
export function useRecipe({onSaved, api = productsApi} = {}) {
  const [target, setTarget] = useState(null);
  const [rows, setRows] = useState([]);
  const [ingredients, setIngredients] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);
  const nextKey = useRef(0);

  const newRow = (idInsumo = '', cantidad = '') => {
    nextKey.current += 1;
    return {key: `fila-${nextKey.current}`, idInsumo, cantidad};
  };

  const open = async (product) => {
    setTarget(product);
    setRows([]);
    setErrors({});
    setModalError('');
    setLoading(true);
    try {
      const [{insumos}, {recipe}] = await Promise.all([api.recipeOptions(), api.recipe(product.id)]);
      setIngredients(indexIngredients(insumos, recipe.ingredientes));
      let initial = recipe.ingredientes.map((item) => newRow(String(item.idInsumo), toText(item.cantidad)));
      if (initial.length === 0) {
        initial = [newRow()];
      }
      setRows(initial);
    }
    catch (requestError) {
      setModalError(requestError.message);
    }
    setLoading(false);
  };

  const clearErrors = () => {
    setErrors({});
    setModalError('');
  };

  const addRow = () => {
    setRows((current) => [...current, newRow()]);
    clearErrors();
  };

  const removeRow = (key) => {
    setRows((current) => current.filter((row) => row.key !== key));
    clearErrors();
  };

  const setRow = (key, field, value) => {
    setRows((current) => current.map((row) => {
      if (row.key === key) {
        return {...row, [field]: value};
      }
      return row;
    }));
    clearErrors();
  };

  const submit = async (event) => {
    event?.preventDefault();
    const nextErrors = validateRecipe(rows);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    setSaving(true);
    try {
      await api.saveRecipe(target.id, toRecipePayload(rows));
      setTarget(null);
      let message = `Se guardó la receta de ${target.nombre}`;
      if (rows.length === 0) {
        message = `Se quitó la receta de ${target.nombre}`;
      }
      onSaved?.(message);
    }
    catch (requestError) {
      setModalError(requestError.message);
    }
    setSaving(false);
  };

  return {
    target,
    rows,
    ingredients,
    loading,
    errors,
    modalError,
    saving,
    portions: computePortions(rows, ingredients),
    open,
    close: () => setTarget(null),
    addRow,
    removeRow,
    setRow,
    submit,
  };
}
