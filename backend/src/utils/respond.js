// Responde el error previsto de un servicio o ejecuta la respuesta de éxito
export const respond = (res, result, onSuccess) => {
  if (result.error) {
    return res.status(result.status).json({message: result.error, ...result.detail});
  }
  else {
    return onSuccess(result);
  }
};
