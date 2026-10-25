# Brasa Brava — Pruebas end to end

Pruebas que recorren el sistema como lo usa el personal: un navegador Chromium real (Playwright) contra la API con PostgreSQL y el build del frontend, con los datos de demostración.

## Ejecución

```bash
npx playwright install chromium          # (una vez) descarga el navegador
npm run test:e2e                         # (desde la raíz) compila el frontend y corre las pruebas
npm run test:e2e -w e2e                  # solo las pruebas, si el build ya está hecho
npx playwright test --ui                 # (desde e2e/) modo visual para depurar
```

Por defecto `src/server.js` arranca un PostgreSQL embebido en una carpeta temporal, así que no hace falta tener PostgreSQL instalado. Para usar uno propio se define `E2E_DATABASE_URL`; **el esquema `public` de esa base se borra al empezar**, así que debe ser una base solo para pruebas.

| Variable | Propósito |
|---|---|
| `E2E_DATABASE_URL` | Base de PostgreSQL para las pruebas (opcional; sin ella se usa la embebida) |
| `E2E_PORT` | Puerto de la API durante las pruebas (por defecto `3200`) |

## Qué se prueba

Los archivos corren en orden y comparten la misma base, porque cada uno sigue lo que hizo el anterior.

| Archivo | Recorrido |
|---|---|
| `01-auth.spec.js` | Contraseña incorrecta, empleado dado de baja, pantallas por cargo, cierre de sesión y modo DIRECTORIO |
| `02-cashier.spec.js` | Abrir una mesa sin mesero, quitar ingredientes, Local y Para llevar, comanda impresa, segundo envío de otro cajero (Registró y Modificado por), Marcar listos, cobro en efectivo con cambio y Ventas de hoy; aviso al cambiar de mesa y Cobrar bloqueado mientras falta algo |
| `03-reports.spec.js` | Resumen del día, detalle de la venta con la columna Consumo y quién registró cada envío, PDF, filtro por empleado, envío por correo y envíos programados del DIRECTORIO |
| `04-deletion.spec.js` | Eliminación física en cascada (empleado, sección con sus mesas y venta cobrada) con la palabra ELIMINAR, la venta borrada que desaparece de Reportes y el acceso solo para el DIRECTORIO |

La impresión se reemplaza por un contador (`stubPrinting`) para no abrir el diálogo del navegador, y el correo usa `MAIL_DRIVER=console`.

En GitHub Actions corren en el trabajo **End to end**, con PostgreSQL 16 como servicio; si fallan, el reporte de Playwright queda como artefacto.
