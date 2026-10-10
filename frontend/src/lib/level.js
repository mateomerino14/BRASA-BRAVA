// El mínimo queda a un tercio de la barra para que "bajo" se vea como poco y no como vacío
const FULL_AT_TIMES_MINIMUM = 3;

// Proporción visual de 0 a 1 del stock respecto de su mínimo
export const levelRatio = (value, minimum) => {
  if (value <= 0) {
    return 0;
  }
  if (minimum <= 0) {
    return 1;
  }
  return Math.min(1, value / (minimum * FULL_AT_TIMES_MINIMUM));
};
