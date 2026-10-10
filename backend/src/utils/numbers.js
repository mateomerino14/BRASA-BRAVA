import {z} from 'zod';

const ROUNDING_TOLERANCE = 1e-6;

// Número decimal desde JSON o texto ("35", "35.5", "35,50") con máximo de decimales y rango
export const decimalSchema = ({label, decimals, max, allowZero = false}) => {
  const factor = 10 ** decimals;
  let number = z.number({error: `Ingrese ${label} válido`}).max(max, `${capitalize(label)} es demasiado alto`);
  if (allowZero) {
    number = number.min(0, `${capitalize(label)} no puede ser negativo`);
  }
  else {
    number = number.positive(`${capitalize(label)} debe ser mayor a 0`);
  }
  return z
    .union([z.number(), z.string().trim().min(1).transform((value) => Number(value.replace(',', '.')))], {error: `Ingrese ${label}`})
    .pipe(number.refine(
      (value) => Math.abs(value * factor - Math.round(value * factor)) < ROUNDING_TOLERANCE,
      `${capitalize(label)} admite hasta ${decimals} decimales`,
    ));
};

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
