# Brasa Brava — Frontend

Interfaz del sistema de gestión del restaurante Brasa Brava. Se usa igual en el navegador y dentro de la aplicación de escritorio.

## Requisitos

- Node.js 22 o superior
- El backend corriendo en `http://localhost:3000` (ver `backend/README.md`)

## Instalación

Desde la raíz del repositorio:

```bash
npm install
```

Opcionalmente, crear un `.env` en la carpeta `frontend` (ver `.env.example`):

| Variable | Propósito |
|---|---|
| `VITE_API_URL` | URL base de la API. Por defecto `/api`: en desarrollo Vite redirige `/api` y `/uploads` al backend y en producción los sirve el mismo backend. Si se usa una URL absoluta, las fotos se piden a ese mismo servidor |

## Ejecución

```bash
npm run dev               # http://localhost:5173
npm run build             # versión de producción en dist/
npm run storybook         # sistema de diseño en http://localhost:6006
npm test                  # pruebas automáticas (Vitest + Testing Library)
```

## Stack

| Tecnología | Propósito |
|---|---|
| React 19 + Vite | Interfaz y empaquetado |
| Tailwind CSS v4 | Estilos a partir de los tokens de la paleta |
| React Router | Navegación y protección de rutas |
| Motion | Animaciones (menú desplegable, modales, transiciones) |
| lucide-react | Íconos |
| @fontsource | Bebas Neue, Inter y Playfair Display SC empaquetadas, sin depender de internet |
| Storybook 10 | Documentación interactiva del sistema de diseño |
| Vitest + Testing Library | Pruebas de componentes y flujos completos |

## Arquitectura

| Capa | Responsabilidad | Restricción |
|---|---|---|
| Servicio (`features/<modulo>/services`) | Llamar a la API | No mantiene estado |
| Hook (`features/<modulo>/hooks`) | Estado, validación y llamadas a servicios | No renderiza JSX |
| Página (`features/<modulo>/pages`) | Invocar hooks y componer organismos | No llama servicios directamente |
| Componente (`components/`) | Presentar datos recibidos por props | No conoce hooks de negocio |

Las pantallas de los módulos se cargan bajo demanda (`React.lazy` en `router/AppRoutes.jsx`): el inicio descarga solo login, menú y Home, y cada pantalla de administración se baja al abrirla.

La sesión se maneja en `context/` (`AuthProvider` y `useAuth`).

Las redes sociales del pie (Facebook, Instagram y TikTok de Brasa Brava Tiquipaya) están en `config/socialLinks.js` y se abren en una pestaña nueva; en la app de escritorio se abren en el navegador predeterminado (Chrome, si es el elegido en Windows).

### Estándar de mensajes de error

- **Error de un campo** (vacío, formato, regla): texto rojo debajo del campo con `FormField` y el borde del campo en rojo. No abre avisos.
- **Error de una operación** (lo que responde el servidor o la red: credenciales incorrectas, código vencido, nombre repetido): aviso emergente con `useToast().error(mensaje, título?)`. Aparece arriba a la derecha, por encima de los modales, con una barra que muestra el tiempo que le queda; se cierra solo a los 5 segundos o con la X, y no repite el mismo mensaje.
- `useToast().success(mensaje)` sirve para confirmaciones breves con el mismo formato, y `useToast().clear()` quita los avisos anteriores cuando la operación sale bien.
- El proveedor (`ToastProvider`) está en `App.jsx`, en `renderApp` de las pruebas y en Storybook.

El inicio de sesión y la recuperación de contraseña ya siguen este estándar. Un aviso con el mismo título reemplaza al anterior en lugar de apilarse. En la verificación, el modal muestra cuánto falta para que venza el código y los intentos que quedan; si el código se bloquea, vence o queda anulado, las casillas se desactivan y el único paso es «Reenviar código». El cliente HTTP (`lib/apiClient.js`) agrega el token, envía JSON o archivos (`FormData`), normaliza los errores y cierra la sesión si el servidor responde que venció.

El foco de modales y del menú de celular lo maneja `useDialogFocus` (enfoca al abrir, mantiene el Tab dentro, cierra con Escape y devuelve el foco). ### Pantallas de gestión estándar

Todas las pantallas de administración se arman igual, así que una pantalla nueva no puede quedar distinta:

| Pieza | Qué resuelve |
|---|---|
| `templates/ManagementPage` | Orden fijo: resumen opcional (tarjetas `StatCard` que filtran), buscador y filtros, avisos, tabla, llamada a registrar y modales |
| `organisms/ListTable` | Tabla con encabezados ordenables, pie "Mostrando 1–5 de N", filas por página (5, 10 o 20), paginación y botón "Limpiar filtros" cuando no hay resultados |
| `molecules/FilterSelect` | Filtros de la barra con el mismo tamaño |
| `hooks/usePaginatedList` | Búsqueda con espera, filtros, página, filas por página y orden guardados en la URL (`?search=...&estado=inactivos&sort=nombre&dir=desc`), recarga y aviso temporal |
| `hooks/useStatusToggle` | Confirmar una baja o reactivación |
| `hooks/useEntityForm` | Formulario de registro y modificación: valores, validación, guardado, foto opcional (`withImage`, `imageField` = `imagenUrl` o `fotoUrl`) y aviso si los datos se guardaron pero la foto no (el reintento modifica en vez de duplicar) |
| `lib/apiClient` → `imageEndpoints('/recurso')` | Endpoints estándar de foto (subir o reemplazar y quitar) que usan categorías, productos, promociones y empleados |
| `lib/format` → `formatTime`, `formatClock`, `formatHours` | Todas las horas de la app en 12 horas con AM/PM ("6:30 PM"), sin depender del idioma de la computadora |
| `hooks/useImagePreview` | Vista previa de una foto: el archivo recién elegido o la guardada (la usan `ImagePicker` y `AvatarPicker`) |
| `lib/imageFile` → `validateImageFile` | Revisa formato (PNG, JPG o WEBP) y peso de la foto elegida; la comparten `ImagePicker` y `AvatarPicker` |

Como el estado vive en la URL, recargar la página o volver atrás conserva búsqueda, filtros, página y orden, y se puede compartir el enlace. Los valores por defecto no se escriben para que la URL quede limpia. Cada módulo solo define su servicio, sus columnas (con `sortKey` en las ordenables), sus filtros y sus mensajes.

## Estructura

```
src/
├── components/
│   ├── atoms/           Button, IconButton, Input, PasswordInput, NumberInput, MoneyInput, Textarea, Select, Switch,
│   │                    Amount, LevelBar, Avatar, Thumbnail, TimeInput,
│   │                    Badge, Logo, Spinner, SocialIcon
│   ├── molecules/       FormField, CodeInput, Alert, Toast, LiveClock, SearchInput, Pagination, PageSizeSelect,
│   │                    FilterSelect, ImagePicker, AvatarPicker, DateInput, TagInput, SegmentedControl, StatCard, Stepper, ChipList,
│   │                    DayPicker, PriceTag
│   ├── organisms/       Sidebar, MobileMenu, Header, Footer, Modal, EmployeeCarousel, DataTable, ListTable, FilterBar,
│   │                    RegisterCallout, ConfirmDialog
│   └── templates/       MainLayout, AuthLayout, ManagementPage
├── features/
│   ├── auth/            Login, carrusel de empleados, modo DIRECTORIO y recuperación
│   ├── home/            Bienvenida con reloj y accesos rápidos
│   ├── employees/       Gestión de empleados: tabla, filtros, registro, modificación y baja
│   ├── roles/           Gestión de cargos: pantallas que ve cada cargo, empleados y baja
│   ├── categories/      Gestión de categorías: foto, subcategorías, filtros, registro y baja
│   ├── products/        Gestión de productos: precio, foto, categoría y subcategoría, disponible/agotado y baja
│   ├── stock/           Inventario: insumos con su cantidad y mínimo; la cantidad se corrige al modificar
│   ├── sections/        Secciones y mesas: resumen del local, editor de mesas con capacidad
│   ├── promotions/      Promociones: combos, precio en vivo, fechas y días, vigencia de hoy
│   ├── family/          Familia: catálogo de productos y promociones, receta con stock y porciones que alcanzan
│   ├── cashier/         Caja en una sola pantalla: secciones y mesas con su espera, Marcar listos, límite de impresiones del ticket, menú del día, pedido con Local/Para llevar e ingredientes quitados, comanda de cocina, cobro, ticket y ventas del día
│   └── shared/          Páginas "en construcción" y 404
├── config/              Menú lateral (navigation.js), valores de las tablas (lists.js) y anchos (breakpoints.js)
├── hooks/               Hooks compartidos: listado paginado, cambio de estado, foco de diálogos y media queries
├── context/             Sesión del usuario
├── router/              Rutas, guardas de sesión y de permisos
├── lib/                 Cliente HTTP, query strings y funciones de formato
├── stories/             Introducción del sistema de diseño en Storybook
└── styles/index.css     Tokens de colores, fuentes, sombras y animaciones
```

## Sistema de diseño

Los colores y fuentes salen del prototipo de Figma y se definen una sola vez en `src/styles/index.css`.

| Token | Color | Uso |
|---|---|---|
| `brasa` | `#F7941D` | Acciones principales y menú lateral |
| `carbon` | `#1C1A18` | Texto, footer y botón Ingresar |
| `mostaza` | `#E8B23D` | Acentos y carrusel del login |
| `crema` | `#FAF3EA` | Superficies: modales, ítem activo del menú y encabezados de tabla (nunca campos) |
| `rojo` | `#C1272D` | Cancelar, cerrar sesión y estados de baja |
| `error` | `#D91A22` | Mensajes de error: campos, avisos emergentes y bordes de campos inválidos |
| `verde` | `#2FA84F` | Éxito y estado activo |
| `campo` | `#FFFFFF` | Fondo de todo campo editable (texto, listas, fechas, cantidades): resalta sobre el crema de los modales |

| Fuente | Clase | Uso |
|---|---|---|
| Bebas Neue | `font-display` | Títulos, marca y botones |
| Inter | `font-sans` | Interfaz, formularios y tablas |
| Playfair Display SC | `font-accent` | Solo el mensaje de bienvenida del Home |

### Efectos visuales

- Menú lateral con el grupo Administración desplegable, una píldora crema que se desliza hasta la pantalla activa y modo compacto de solo íconos, que se activa con la pestaña redonda del borde.
- En celular y tablet, barra naranja fija arriba (`MobileTopBar`) y menú tipo persiana (`MobileMenu`) que baja desde la barra tablilla por tablilla, con Administración desplegable, el usuario y «Salir» abajo.
- Títulos de pantalla con tres marcas de parrilla (naranja, mostaza y carbón) que crecen al entrar.
- Página principal: pizarra carbón con rayas de parrilla, una brasa que respira y la hora del local; resumen del día como marcador con números que suben una vez (`CountUp`) y barras de proporción; accesos rápidos como una carta de restaurante con línea de puntos.
- Modales con fondo desenfocado y entrada con rebote; los pasos de la recuperación de contraseña se deslizan.
- Botones que se elevan al pasar el mouse y se hunden al presionar.
- Código de verificación que avanza solo, acepta pegar y tiembla si es incorrecto.
- Logo con brillo de brasa, reloj en vivo y transición suave entre pantallas.
- Subcategorías en chips que se despliegan con "+N más" y entran escalonadas; en el formulario aparecen y desaparecen con rebote.
- Recetas con filas de insumo que entran y salen animadas y el cálculo de porciones en vivo.
- Selector de foto con arrastrar y soltar, vista previa inmediata y acciones Cambiar/Quitar sobre la imagen.

Todo respeta la opción del sistema "reducir movimiento".

### Diseño adaptable

| Ancho | Menú | Tablas |
|---|---|---|
| Escritorio (1024 px o más) | Lateral fijo, contraíble a solo íconos | Tabla completa |
| Tablet (768 a 1023 px) | Botón ☰ que abre un panel deslizable | Tarjetas en dos columnas |
| Celular (menos de 768 px) | Panel deslizable con el perfil y "Cerrar sesión" al pie | Tarjetas en una columna |

- El panel se cierra con la X, con Escape, tocando el fondo o al elegir una pantalla, y devuelve el foco al botón ☰.
- En celular y tablet el pie de página se desplaza con el contenido para no ocupar pantalla fija.
- Las columnas de `DataTable` indican cómo se ven en tarjeta: `mobile: 'title'` (encabezado), `mobile: 'actions'` (botones a la derecha), `mobile: 'hidden'` (se omite) y `wide: true` (ocupa todo el ancho); el resto se muestra como etiqueta y valor.
- Los anchos están en `src/config/breakpoints.js` y se leen con el hook `useMediaQuery`.

## Rutas

| Ruta | Pantalla | Permiso |
|---|---|---|
| `/login` | Inicio de sesión y recuperación de contraseña | Público |
| `/` | Página principal: saludo, resumen de hoy según el cargo (con permiso de Caja: vendido, efectivo, QR, mesas ocupadas y por cobrar, y lo que falta en cocina con la espera más larga; se recarga cada 30 s) y accesos rápidos | Todos |
| `/familia` | Familia: catálogo (`?ver=promociones`, `?categoria=`, `?sub=`, `?q=`) | `familia` |
| `/caja` | Caja: plano de mesas (`?seccion=`) y pedido de una mesa (`?mesa=`) | `caja` |
| `/empleados` | Gestión de empleados | `empleados` |
| `/cargos` | Gestión de cargos y sus pantallas | `cargos` |
| `/categorias` | Gestión de categorías | `categorias` |
| `/productos` | Gestión de productos | `productos` |
| `/inventario` | Inventario de insumos | `stock` |
| `/secciones` | Gestión de secciones y mesas | `secciones` |
| `/promociones` | Gestión de promociones | `promociones` |

En el navegador la impresión usa el diálogo: `PrintPreview` muestra la vista previa y pone el documento en un contenedor `.print-only`, que es lo único que se imprime, con el ancho de una ticketera de 80 mm. Con `autoPrint` imprime solo (el ticket de venta al cobrar). En la app de escritorio, si `destino` (`cocina` o `caja`) tiene una impresora elegida, imprime sin diálogo: `lib/desktopPrinting.js` arma el HTML del documento con los estilos de impresión y lo envía por `window.brasaDesktop`; `hooks/useDesktopPrinters.js` comparte la elección de impresoras entre pantallas. Si falla, muestra el error y el botón **Imprimir con diálogo**. La comanda se imprime sola al enviar a cocina. `guard` se consulta antes de cada impresión: el ticket de cobro lo usa para contar las impresiones (`usePrintAuthorization`), y desde la 4.ª pide usuario y contraseña de un empleado con acceso a Caja, que queda registrado.

Todas las pantallas del menú ya están construidas; una pantalla nueva que se agregue al menú sin página muestra un aviso de "en construcción" hasta tenerla. Si un usuario entra a una ruta sin permiso, vuelve al Home.

## Pruebas

Las pruebas simulan al usuario real (escribir, hacer clic, pegar el código) contra un backend falso (`src/test/mockApi.js`). Cubren el login, el resumen del día en la página principal por cargo, el modo DIRECTORIO, la recuperación completa, la sesión vencida, los permisos por cargo, el menú desplegable, la gestión de cargos (pantallas por grupo y una por una, aviso de a cuántos empleados afecta, baja bloqueada por el servidor), el cambio de contraseña del DIRECTORIO (botón solo para él, contraseña actual equivocada en su campo y confirmación), la gestión de empleados (filtros, usuario sugerido con el nombre que se respeta si se escribe a mano, cargo y foto en la tarjeta de arriba, registro, modificación, baja y errores del servidor), la de categorías (subcategorías en filas que se agregan, renombran y quitan, subida y retiro de la foto, nombre duplicado y foto que falla después de guardar), la de productos (subcategoría dependiente de la categoría, precio con coma, interruptor de agotado, categoría de baja al modificar, receta con porciones en vivo e insumos de baja), Caja (una sola pantalla con secciones y mesas arriba, mesa elegida en la URL, menú que pide elegir mesa primero, espera legible aunque sea de días, Marcar listos en tres columnas con +1 y Todo listo, aviso al cambiar de mesa con productos sin enviar, límite de 3 impresiones del ticket con autorización, menú por categoría y búsqueda sin tildes, stock bajo sin bloquear, quitar ingredientes en productos y combos, líneas iguales que se juntan, editar y quitar líneas, sin mesero (cada envío dice quién lo registró), abrir mesa y sumar envíos, error del servidor, pedido desde la barra inferior en celular, comanda solo con lo nuevo de cada envío, "MODIFICADO POR", reimpresión e insumos sin stock), impresión directa en escritorio (botón Impresoras solo en escritorio, comanda y ticket sin diálogo, error con impresión por diálogo, elección y prueba de impresoras), cobro (bloqueo hasta que cocina termine, efectivo con montos rápidos y cambio, mixto con parte por QR, QR, error del servidor, ticket impreso solo y mesa libre, ventas del día con reimpresión y cambio del enlace de impuestos solo con Administración), Familia (avisos emergentes y reintentar si no carga el catálogo o la receta, estado de stock en tarjetas, filtros en la URL, búsqueda sin tildes, receta con stock y porciones, promociones con cuándo aplican, incluido su horario), la de promociones (combo con cantidades y precio que debe ser menor, solo combos y días obligatorios, horario opcional con inicio y fin en 12 horas con AM/PM, fechas en día/mes/año con calendario propio, producto de baja al modificar), la de secciones (mesas agrupadas por tamaño en la tabla, mesas numeradas automáticamente, capacidad con botones, mesas repetidas, modificar conservando ids), el inventario (cantidad pintada por nivel, registro con cantidad inicial y corrección de la cantidad al modificar), el comportamiento estándar de las pantallas de gestión (filtros y orden en la URL, filas por página, limpiar filtros y orden en tarjetas), los avisos emergentes de éxito y de error del servidor, la tabla que ofrece reintentar si la lista no carga, los componentes base y la interfaz adaptable (menú deslizable en celular, cierre con Escape y al navegar, cierre de sesión desde el menú y tablas como tarjetas). Las pruebas simulan escritorio por defecto; `setViewport(ancho)` de `src/test/viewport.js` cambia el ancho.
