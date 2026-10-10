import {respond} from '../../utils/respond.js';

// Acciones de foto reutilizables por cualquier módulo cuyo repositorio tenga findById y setImage;
// "imageOf" lee la URL guardada de la fila (imagen_url en el catálogo, foto_url en empleados)
export const createImageActions = ({repository, images, getById, notFound, imageOf = (row) => row.imagen_url}) => ({
  // Guarda la nueva foto, la asocia y recién entonces borra la anterior
  setImage: async (id, buffer) => {
    const current = await repository.findById(id);
    if (!current) {
      return notFound;
    }
    const saved = await images.save(buffer);
    if (saved.error) {
      return saved;
    }
    await repository.setImage(id, saved.url);
    await images.remove(imageOf(current));
    return getById(id);
  },

  // Quita la foto del registro y borra el archivo
  removeImage: async (id) => {
    const current = await repository.findById(id);
    if (!current) {
      return notFound;
    }
    await repository.setImage(id, null);
    await images.remove(imageOf(current));
    return getById(id);
  },
});

// Controladores HTTP de foto: responden el registro actualizado bajo la clave indicada
export const createImageHandlers = (service, key) => ({
  // Sube o reemplaza la foto
  setImage: async (req, res) => {
    const result = await service.setImage(req.validated.params.id, req.file.buffer);
    return respond(res, result, (data) => res.json({[key]: data[key]}));
  },

  // Quita la foto
  removeImage: async (req, res) => {
    const result = await service.removeImage(req.validated.params.id);
    return respond(res, result, (data) => res.json({[key]: data[key]}));
  },
});
