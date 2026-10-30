# Brasa Brava — Escritorio

Aplicación de Windows que empaqueta el sistema completo: al abrirla arranca una base PostgreSQL embebida, la API y la interfaz en una ventana. No necesita internet ni instalar PostgreSQL.

## Requisitos

- Node.js 22 o superior (solo para desarrollar)
- Windows 10 u 11 para generar el instalador

## Ejecución

```bash
npm run build -w frontend    # (desde la raíz) compila la interfaz
npm start                    # abre la aplicación con ese build
npm run dev                  # abre la aplicación apuntando a Vite (npm run dev:frontend)
npm test                     # pruebas de configuración y arranque con PostgreSQL embebido
npm run dist                 # instalador .exe en release/
```

`npm run dist` debe correrse en Windows: el instalador incluye el PostgreSQL de la plataforma donde se genera.

## Generar el instalador para el local

La versión que se instala en el local sale siempre de la rama `main`:

```bash
git checkout main
git pull
npm ci
npm run dist -w electron     # deja Brasa Brava Setup <versión>.exe en electron/release/
```

Para actualizar un local se instala la versión nueva encima de la anterior: la base y las fotos viven en la carpeta del usuario y no se tocan, y las migraciones nuevas se aplican solas al abrir.

## Funcionamiento

| Archivo | Responsabilidad |
|---|---|
| `src/settings.js` | Crea la primera vez `brasa-brava.json` en `%APPDATA%/Brasa Brava`, con un secreto de sesión y una contraseña de base aleatorios para esa PC |
| `src/services.js` | Arranca PostgreSQL embebido en `pgdata/` en un puerto libre, crea la base si no existe, levanta la API (que aplica las migraciones) y sirve la interfaz |
| `src/main.js` | Abre la ventana y, al cerrarla, detiene la API y la base de forma ordenada; los enlaces externos `https` (redes sociales) se abren en el navegador predeterminado |
| `src/printers.js` | Lista las impresoras instaladas en Windows, guarda la de cocina y la de caja en `impresoras.json` e imprime sin diálogo en una ventana oculta |
| `src/preload.cjs` | Expone a la interfaz `window.brasaDesktop` (`listPrinters`, `getPrinters`, `savePrinters`, `print`) sin dar acceso a Node |

Los datos (la base en `pgdata/` y las fotos en `uploads/`) quedan en la carpeta del usuario, así que actualizar la aplicación no los borra.

## Configuración

`brasa-brava.json` admite:

| Clave | Propósito |
|---|---|
| `mailDriver` | `console` (por defecto) o `brevo` para enviar correos reales: códigos de recuperación de contraseña y reportes de ventas (a pedido y programados) |
| `brevoApiKey` | Clave de Brevo, si se usa `brevo` |
| `seedDemoData` | `true` por defecto: carga los datos de demostración (cargos, empleados, menú, mesas y ventas) en las tablas que estén vacías. En un local real, crear antes de la primera apertura `%APPDATA%/Brasa Brava/brasa-brava.json` con `{"seedDemoData": false}`: el sistema arranca vacío, solo con la cuenta del DIRECTORIO (contraseña inicial `Directorio2026`, que pide cambiar al primer ingreso) |

El archivo está en `%APPDATA%/Brasa Brava/brasa-brava.json`; los cambios se toman al volver a abrir la aplicación. Los correos salen con el remitente `no-reply@brasabrava.bo`, que debe estar verificado en la cuenta de Brevo. Mientras siga en `console`, el sistema avisa en Reportes y en la recuperación de contraseña que el correo no está configurado y no llega a nadie.

Los envíos programados de reportes solo corren mientras la aplicación está abierta; si estuvo cerrada a la hora de un envío, sale al abrirla.

## Impresión directa

Desde Caja → **Impresoras** (botón visible solo en escritorio) se elige la ticketera de cocina y la de caja entre las impresoras instaladas en Windows, con una hoja de prueba para cada una. La elección queda en `impresoras.json` de la carpeta de datos, solo para esa PC.

- Al **Enviar a cocina**, la comanda sale sola en la impresora de cocina.
- Al **cobrar**, el ticket sale solo en la impresora de caja ; al reimprimir desde Ventas de hoy, el botón **Imprimir** también lo envía ahí.
- Si la impresora no está instalada o falla, se muestra el error y la vista previa con **Imprimir con diálogo**.
- Un lugar sin impresora elegida usa el diálogo de impresión, igual que la versión web.
