export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export const DEFAULT_MAX_MB = 5;
const BYTES_PER_MB = 1024 * 1024;

// Revisa que la foto elegida sea PNG, JPG o WEBP y no pese más de lo permitido
export const validateImageFile = (file, maxMb = DEFAULT_MAX_MB) => {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return 'La imagen debe ser PNG, JPG o WEBP';
  }
  if (file.size > maxMb * BYTES_PER_MB) {
    return `La imagen no puede pesar más de ${maxMb} MB`;
  }
  return '';
};
