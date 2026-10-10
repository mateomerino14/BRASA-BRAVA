const DESKTOP_WIDTH = 1440;
let viewportWidth = DESKTOP_WIDTH;

// Resuelve las media queries de ancho mínimo con el ancho simulado
export const matchesViewport = (query) => {
  const minWidth = /min-width:\s*(\d+)px/.exec(query);
  if (minWidth) {
    return viewportWidth >= Number(minWidth[1]);
  }
  return false;
};

// Cambia el ancho simulado para probar la interfaz en celular o tablet
export const setViewport = (width = DESKTOP_WIDTH) => {
  viewportWidth = width;
};
