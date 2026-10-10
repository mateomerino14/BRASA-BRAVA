import multer from 'multer';
import {badRequest} from '../utils/httpError.js';

const maxImageBytes = 5 * 1024 * 1024;

const imageUpload = multer({storage: multer.memoryStorage(), limits: {fileSize: maxImageBytes, files: 1}});

// Recibe una sola imagen en memoria (campo "imagen", máximo 5 MB)
export const uploadImage = (req, res, next) => {
  imageUpload.single('imagen')(req, res, (error) => {
    if (error?.code === 'LIMIT_FILE_SIZE') {
      return next(badRequest('La imagen no puede pesar más de 5 MB'));
    }
    if (error) {
      return next(badRequest('No se pudo leer la imagen enviada'));
    }
    if (!req.file) {
      return next(badRequest('Adjunte una imagen'));
    }
    return next();
  });
};
