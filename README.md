# Brasa Brava — Sistema de Gestión

Sistema interno del restaurante Brasa Brava: inicio de sesión por empleado, caja (con lo que sale de cocina), catálogo y administración de productos, categorías, stock, secciones y mesas, promociones, empleados y cargos.

Funciona de dos formas con el mismo código:

- **Escritorio (Windows):** una sola aplicación que trae su propia base PostgreSQL. No necesita internet ni instalar nada aparte.
- **Web:** API y frontend desplegables en un servidor, con PostgreSQL en la nube.

El diseño sale del prototipo de Figma *Brasa Brava* (paleta, tipografías y pantallas).

## Requisitos

- Node.js 22 o superior
- PostgreSQL 14 o superior (solo para la versión web)

## Instalación

```bash
git clone https://github.com/mateomerino14/BRASA-BRAVA.git
cd BRASA-BRAVA
npm install
cp backend/.env.example backend/.env    # ajustar DATABASE_URL
npm run db:seed                         # crea las tablas y los datos de prueba
```

## Ejecución

```bash
npm run dev:backend       # API en http://localhost:3000
npm run dev:frontend      # interfaz en http://localhost:5173
npm run dev:desktop       # aplicación de escritorio (requiere npm run build)
npm run storybook         # sistema de diseño en http://localhost:6006
npm test                  # todas las pruebas
npm run lint              # revisión de estándares de código
```

### Usuarios de prueba

| Usuario | Contraseña | Cargo |
|---|---|---|
| `DIRECTORIO` (botón Modo directorio) | `Directorio2026` | Acceso total |
| `admin` | `Brasa2026` | Administrador |
| `a.romero` | `Brasa2026` | Cajero |
| `c.mendoza` | `Brasa2026` | Mesero |
| `r.sanchez` | `Brasa2026` | Cocinero |
| `j.ortiz` | `Brasa2026` | Mesero (dado de baja, no puede ingresar) |

Para probar la recuperación de contraseña se usa `c.mendoza@brasabrava.bo`; con `MAIL_DRIVER=console` el código aparece en la terminal del backend.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, React Router, Motion, lucide-react |
| Backend | Node.js 22, Express 5, PostgreSQL, Zod, JWT, bcrypt |
| Escritorio | Electron, PostgreSQL embebido, electron-builder |
| Calidad | Vitest, Testing Library, Supertest, pg-mem, Storybook 10, ESLint, GitHub Actions |
| Correo | Brevo |

## Estructura

Monorepo con tres paquetes (npm workspaces):

```
BRASA-BRAVA/
├── backend/              API REST (ver backend/README.md)
├── frontend/             Interfaz React (ver frontend/README.md)
├── electron/             Aplicación de escritorio (ver electron/README.md)
├── .github/workflows/    Pruebas automáticas en cada Pull Request
├── eslint.style.js       Reglas de formato compartidas
└── reglas.md             Estándares de ramas, commits y codificación
```

## Módulos

| Módulo | Estado |
|---|---|
| Sistema de diseño (paleta, tipografía, menú lateral, modales) | Terminado |
| Autenticación (login, modo DIRECTORIO, recuperación con código) | Terminado |
| Página principal | Terminado |
| Aplicación de escritorio | Terminado |
| Gestión de empleados (listado, filtros, registro, modificación y baja) | Terminado |
| Gestión de cargos (pantallas que ve cada cargo, baja y reactivación) y cambio de contraseña del DIRECTORIO | Terminado |
| Gestión de categorías (subcategorías, foto, filtros, baja y reactivación) | Terminado |
| Interfaz adaptable a celular y tablet (menú deslizable y tablas en tarjetas) | Terminado |
| Pantallas de gestión estándar (filtros en la URL, orden por columna, filas por página, limpiar filtros) | Terminado |
| Gestión de productos (precio, foto, categoría, disponible/agotado, baja y reactivación) | Terminado |
| Inventario de insumos (cantidad, mínimo y corrección de la cantidad) | Terminado |
| Recetas de productos (insumos por porción y porciones que alcanzan con el stock) | Terminado |
| Secciones y mesas (ambientes del local, mesas con capacidad y resumen) | Terminado |
| Promociones (combos a precio fijo con fechas, días, horario opcional y vigencia del momento) | Terminado |
| Caja: plano de mesas y armado del pedido (Local o Para llevar, quitar ingredientes, envíos a la mesa ocupada) | Terminado |
| Caja: comanda de cocina por envío, descuento de stock por receta y marca de venta modificada | Terminado |
| Caja en una sola pantalla: secciones y mesas arriba con su espera, pedido a la izquierda, menú a la derecha y Marcar listos (Local / Para llevar / Faltan); cocina solo recibe la comanda impresa | Terminado |
| Reportes de ventas: resumen por día y ventas detalladas por fechas y empleado, en PDF o por correo; envíos programados por el DIRECTORIO que salen al encender si se perdieron | Terminado |
| Ticket de cobro: 3 impresiones libres y desde la 4.ª usuario y contraseña de cualquier empleado con acceso a Caja, que queda registrado como quien autorizó | Terminado |
| Caja: cobro (efectivo, QR o mixto con cambio), ticket de venta impreso al cobrar, ventas del día y enlace a impuestos | Terminado |
| Familia: catálogo del local con productos por categoría, receta y porciones que alcanzan, y promociones con cuándo aplican | Terminado |
| Impresión directa en escritorio: comanda en la ticketera de cocina y ticket en la de caja, sin diálogo, con hoja de prueba | Terminado |

## Ramas y pruebas automáticas

El trabajo sigue el flujo `feature/<modulo>` → `develop` → `main` descrito en `reglas.md`. En cada Pull Request, GitHub Actions revisa los estándares de código, corre las pruebas del backend (con base en memoria y con PostgreSQL 16), las del frontend, compila la interfaz y Storybook, y prueba el arranque de escritorio con PostgreSQL embebido.
