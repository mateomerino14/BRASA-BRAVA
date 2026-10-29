const DESKTOP_WIDTH = 1440;
let viewportWidth = DESKTOP_WIDTH;

export const matchesViewport = (query) => {
  const minWidth = /min-width:\s*(\d+)px/.exec(query);
  if (minWidth) {
    return viewportWidth >= Number(minWidth[1]);
  }
  return false;
};

export const setViewport = (width = DESKTOP_WIDTH) => {
  viewportWidth = width;
};
