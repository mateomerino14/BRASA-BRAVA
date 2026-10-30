# Brasa Brava — Manual de usuario

Manual en LaTeX para el personal del restaurante: ingreso, Caja, Familia, Reportes, Administración y Eliminación física, con capturas del sistema.

## Compilar

```bash
cd docs/manual
latexmk -pdf manual.tex      # o: pdflatex manual.tex (dos veces, para el índice)
```

Necesita una distribución de LaTeX con `babel` (español), las fuentes `inter`, `montserrat` y `sourcecodepro`, y los paquetes `tcolorbox`, `titlesec`, `titletoc`, `paracol` y `fancyhdr`. Todo viene en TeX Live completo, MiKTeX (los instala solo al compilar) y Overleaf.

El PDF listo para leer o imprimir está en `Manual_Usuario_Brasa_Brava.pdf`. Al cambiar un capítulo se compila de nuevo y se reemplaza ese archivo con el `manual.pdf` que genera LaTeX, en el mismo Pull Request, para que el PDF nunca quede atrás del texto.

## Diseño

- Títulos en **Montserrat** y texto en **Inter**, con la paleta de Brasa Brava (naranja brasa, carbón y hueso).
- Párrafos sin sangría, separados por un pequeño espacio.
- Los capítulos siguen en la misma hoja, sin saltos de página.
- Las pantallas completas flotan para llenar las hojas; las ventanas (formularios y diálogos) van recortadas al lado de su explicación, en dos columnas que pueden seguir en la hoja siguiente.

## Estructura

| Archivo | Contenido |
|---|---|
| `manual.tex` | Portada, estilos (paleta de Brasa Brava) e índice |
| `capitulos/01-introduccion.tex` | Qué hace el sistema, escritorio y web, pantallas por cargo |
| `capitulos/02-ingreso.tex` | Inicio de sesión, modo DIRECTORIO, recuperación y cierre de sesión |
| `capitulos/03-inicio.tex` | Página principal, menú lateral y uso en celular |
| `capitulos/04-familia.tex` | Catálogo, recetas y promociones |
| `capitulos/05-caja.tex` | Mesas, pedido, comanda, Marcar listos, cobro, ticket, límite de impresiones, Ventas de hoy e impresoras |
| `capitulos/06-reportes.tex` | Resumen y ventas detalladas, detalle de venta, PDF, correo y envíos programados |
| `capitulos/07-administracion.tex` | Productos y recetas, secciones, inventario, categorías, promociones, empleados y cargos |
| `capitulos/08-eliminacion.tex` | Eliminación física en cascada |
| `capitulos/09-problemas.tex` | Preguntas frecuentes |
| `capturas/` | Capturas de pantalla (JPG) |

## Actualizar las capturas

Las capturas salen del sistema real con los datos de demostración, así que se regeneran cuando cambia la interfaz:

```bash
npm run build -w frontend                  # (desde la raíz)
npm run manual:capturas -w e2e             # recorre el sistema y guarda las capturas en docs/manual/capturas
```

El recorrido está en `e2e/manual/capturas.spec.js` y usa la misma base que las pruebas end to end (ver `e2e/README.md`).
