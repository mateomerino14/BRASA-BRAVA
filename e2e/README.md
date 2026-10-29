# Pruebas end to end

Recorren el sistema como lo usa el personal: en un navegador Chromium real, con la API y una base PostgreSQL de verdad. Complementan las pruebas de cada paquete (Vitest con pg-mem, Testing Library y Electron).

## Qué cubren

| Archivo | Flujo |
|---|---|
| `auth.spec.js` | Contraseña incorrecta, ingreso del administrador, menú según los permisos del cargo, modo DIRECTORIO y cierre de sesión |
| `caja.spec.js` | Pedido en una mesa (cantidad y para llevar), comanda de cocina, Marcar listos, cobro con cambio, las 3 impresiones del ticket y la 4.ª con autorización de un empleado con Caja, Ventas de hoy |
| `gestion.spec.js` | Registro de una categoría, catálogo de Familia y permiso de Reportes asignado a un cargo |
| `reportes.spec.js` | Resumen y ventas detalladas, descarga del PDF y envío por correo |
| `eliminacion.spec.js` | Eliminación física de un empleado dado de baja (solo el DIRECTORIO) |

## Cómo funcionan

Al arrancar, `scripts/startServer.js` borra y vuelve a crear la base `brasa_e2e`, aplica las migraciones, carga los datos de demostración y levanta la API en el puerto 3100 sirviendo el build del frontend. Las pruebas corren en serie porque comparten esa base. El diálogo de impresión del navegador se reemplaza por un contador, y el correo usa el driver `console`.

## Ejecutar

Requiere PostgreSQL en marcha (usuario `postgres`, contraseña `postgres`).

```bash
npx playwright install chromium   # solo la primera vez
npm run e2e                       # desde la raíz: compila el frontend y corre las pruebas
npm run e2e:ui -w e2e             # modo interactivo
```

Para otro servidor de base: `E2E_DATABASE_SERVER=postgres://usuario:clave@host:5432 npm run e2e`.

Si una prueba falla, el informe queda en `e2e/playwright-report` con captura y traza.
