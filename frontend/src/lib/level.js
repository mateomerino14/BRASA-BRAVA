const FULL_AT_TIMES_MINIMUM = 3;

export const levelRatio = (value, minimum) => {
  if (value <= 0) {
    return 0;
  }
  if (minimum <= 0) {
    return 1;
  }
  return Math.min(1, value / (minimum * FULL_AT_TIMES_MINIMUM));
};
