const QUANTITY_PATTERN = /^\d{1,5}([.,]\d{1,3})?$/;

export const parseQuantity = (text) => Number(String(text).trim().replace(',', '.'));

// Errores por fila de la receta: insumo elegido, sin repetir, y cantidad mayor a 0 con hasta 3 decimales
export const validateRecipe = (rows) => {
  const errors = {};
  const seen = new Set();
  for (const row of rows) {
    const quantity = String(row.cantidad).trim();
    if (!row.idInsumo) {
      errors[row.key] = 'Seleccione un insumo';
    }
    else if (seen.has(row.idInsumo)) {
      errors[row.key] = 'Este insumo ya está en la receta';
    }
    else if (!QUANTITY_PATTERN.test(quantity)) {
      errors[row.key] = 'Ingrese una cantidad válida, con hasta 3 decimales';
    }
    else if (parseQuantity(quantity) <= 0) {
      errors[row.key] = 'La cantidad debe ser mayor a 0';
    }
    seen.add(row.idInsumo);
  }
  return errors;
};

// Porciones que alcanzan con el stock de cada insumo; null si todavía no hay filas completas
export const computePortions = (rows, ingredientsById) => {
  const complete = rows.filter((row) => row.idInsumo && parseQuantity(row.cantidad) > 0);
  if (complete.length === 0) {
    return null;
  }
  return Math.min(...complete.map((row) => {
    const ingredient = ingredientsById.get(row.idInsumo);
    if (!ingredient?.activo) {
      return 0;
    }
    return Math.floor(ingredient.stockActual / parseQuantity(row.cantidad));
  }));
};

export const toRecipePayload = (rows) => rows.map((row) => ({idInsumo: Number(row.idInsumo), cantidad: parseQuantity(row.cantidad)}));
