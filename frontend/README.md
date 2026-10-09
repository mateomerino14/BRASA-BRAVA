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
| `VITE_API_URL` | URL base de la API. Por defecto `/api`: en desarrollo Vite la redirige al backend y en producción la sirve el mismo backend |

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

La sesión se maneja en `context/` (`AuthProvider` y `useAuth`). El cliente HTTP (`lib/apiClient.js`) agrega el token, normaliza los errores y cierra la sesión si el servidor responde que venció.

## Estructura

```
src/
├── components/
│   ├── atoms/           Button, Input, PasswordInput, Avatar, Badge, Logo, Spinner, SocialIcon
│   ├── molecules/       FormField, CodeInput, Alert, LiveClock
│   ├── organisms/       Sidebar, Header, Footer, Modal, EmployeeCarousel
│   └── templates/       MainLayout, AuthLayout
├── features/
│   ├── auth/            Login, carrusel de empleados, modo DIRECTORIO y recuperación
│   ├── home/            Bienvenida con reloj y accesos rápidos
│   └── shared/          Páginas "en construcción" y 404
├── config/navigation.js Menú lateral y pantalla que exige cada ruta
├── context/             Sesión del usuario
├── router/              Rutas, guardas de sesión y de permisos
├── lib/                 Cliente HTTP y funciones de formato
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
| `crema` | `#FAF3EA` | Fondos suaves, modales e ítem activo |
| `rojo` | `#C1272D` | Cancelar, cerrar sesión y errores |
| `verde` | `#2FA84F` | Éxito y estado activo |

| Fuente | Clase | Uso |
|---|---|---|
| Bebas Neue | `font-display` | Títulos, marca y botones |
| Inter | `font-sans` | Interfaz, formularios y tablas |
| Playfair Display SC | `font-accent` | Solo el mensaje de bienvenida del Home |

### Efectos visuales

- Menú lateral con el grupo Administración desplegable, una píldora crema que se desliza hasta la pantalla activa y modo compacto de solo íconos.
- Modales con fondo desenfocado y entrada con rebote; los pasos de la recuperación de contraseña se deslizan.
- Botones que se elevan al pasar el mouse y se hunden al presionar.
- Código de verificación que avanza solo, acepta pegar y tiembla si es incorrecto.
- Logo con brillo de brasa, reloj en vivo y transición suave entre pantallas.

Todo respeta la opción del sistema "reducir movimiento".

## Rutas

| Ruta | Pantalla | Permiso |
|---|---|---|
| `/login` | Inicio de sesión y recuperación de contraseña | Público |
| `/` | Página principal | Todos |
| `/familia`, `/caja` | Familia y Caja | `familia`, `caja` |
| `/productos`, `/secciones`, `/stock`, `/categorias`, `/promociones`, `/empleados` | Administración | Uno por pantalla |

Las pantallas que todavía no se construyeron muestran un aviso de "en construcción". Si un usuario entra a una ruta sin permiso, vuelve al Home.

## Pruebas

Las pruebas simulan al usuario real (escribir, hacer clic, pegar el código) contra un backend falso (`src/test/mockApi.js`). Cubren el login, el modo DIRECTORIO, la recuperación completa, la sesión vencida, los permisos por cargo, el menú desplegable y los componentes base.
