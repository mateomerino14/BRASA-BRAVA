// Puente de la app de escritorio (preload de Electron); en el navegador no existe
export const desktopBridge = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.brasaDesktop ?? null;
};

// Todas las reglas CSS cargadas en la página, para que el documento se imprima con los mismos estilos
const pageCss = () => [...document.styleSheets].map((sheet) => {
  try {
    return [...sheet.cssRules].map((rule) => rule.cssText).join('\n');
  }
  catch {
    return '';
  }
}).join('\n');

// Documento HTML completo de un ticket; el renderizador se descarga recién la primera vez que se imprime
export const documentHtml = async (node) => {
  const {renderToStaticMarkup} = await import('react-dom/server');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>${pageCss()}
html, body { margin: 0; background: #fff; }
</style></head><body><div class="print-only">${renderToStaticMarkup(node)}</div></body></html>`;
};

// Manda un documento a la impresora de un destino ("cocina" o "caja") sin diálogo; "impresora" fuerza una (hoja de prueba)
export const printOnDesktop = async (destino, node, impresora) => {
  const bridge = desktopBridge();
  if (!bridge) {
    return {ok: false, error: 'La impresión directa solo está en la app de escritorio'};
  }
  try {
    return await bridge.print({destino, html: await documentHtml(node), impresora});
  }
  catch (problem) {
    return {ok: false, error: problem.message};
  }
};
