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

## Funcionamiento

| Archivo | Responsabilidad |
|---|---|
| `src/settings.js` | Crea la primera vez `brasa-brava.json` en `%APPDATA%/Brasa Brava`, con un secreto de sesión y una contraseña de base aleatorios para esa PC |
| `src/services.js` | Arranca PostgreSQL embebido en `pgdata/` en un puerto libre, crea la base si no existe, levanta la API (que aplica las migraciones) y sirve la interfaz |
| `src/main.js` | Abre la ventana y, al cerrarla, detiene la API y la base de forma ordenada |

Los datos (la base en `pgdata/` y las fotos en `uploads/`) quedan en la carpeta del usuario, así que actualizar la aplicación no los borra.

## Configuración

`brasa-brava.json` admite:

| Clave | Propósito |
|---|---|
| `mailDriver` | `console` (por defecto) o `brevo` para enviar correos reales |
| `brevoApiKey` | Clave de Brevo, si se usa `brevo` |
| `seedDemoData` | `false` antes del primer arranque para no cargar los usuarios de prueba |
