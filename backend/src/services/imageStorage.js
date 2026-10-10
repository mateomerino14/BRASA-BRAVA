import {randomUUID} from 'node:crypto';
import {mkdir, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';

export const UPLOADS_ROUTE = '/uploads';

// Firmas binarias de los formatos aceptados (no se confía en la extensión ni en el tipo declarado)
const SIGNATURES = [
  {ext: 'png', matches: (bytes) => bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))},
  {ext: 'jpg', matches: (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff},
  {ext: 'webp', matches: (bytes) => bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP'},
];

// Detecta el formato real de una imagen a partir de sus primeros bytes
export const detectImageType = (buffer) => SIGNATURES.find((signature) => signature.matches(buffer))?.ext ?? null;

// Guarda imágenes en una carpeta local y las expone bajo /uploads
export const createImageStorage = (directory) => {
  const root = path.resolve(directory);

  // Guarda la imagen con un nombre aleatorio y devuelve su URL pública
  const save = async (buffer) => {
    const ext = detectImageType(buffer);
    if (!ext) {
      return {error: 'La imagen debe ser PNG, JPG o WEBP', status: 400};
    }
    await mkdir(root, {recursive: true});
    const fileName = `${randomUUID()}.${ext}`;
    await writeFile(path.join(root, fileName), buffer);
    return {url: `${UPLOADS_ROUTE}/${fileName}`};
  };

  // Borra una imagen guardada antes; ignora URLs ajenas a la carpeta
  const remove = async (url) => {
    if (!url?.startsWith(`${UPLOADS_ROUTE}/`)) {
      return;
    }
    const filePath = path.join(root, path.basename(url));
    try {
      await unlink(filePath);
    }
    catch (error) {
      // Si el archivo ya no existe no hay nada que borrar
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  };

  return {root, save, remove};
};
