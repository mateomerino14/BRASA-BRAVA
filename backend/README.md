# Brasa Brava — Backend

API REST del sistema de gestión del restaurante Brasa Brava. La misma API corre en el servidor web y dentro de la aplicación de escritorio, donde Electron la arranca junto a una base PostgreSQL embebida.

## Requisitos

- Node.js 22 o superior
- PostgreSQL 14 o superior (solo para la versión web; el escritorio trae su propia base)

## Instalación

Desde la raíz del repositorio (instala los tres paquetes a la vez):

```bash
npm install
```

Crear un archivo `.env` en la carpeta `backend` (ver `.env.example`):

```
PORT=3000
NODE_ENV=development
DATABASE_URL=postgres://postgres:postgres@localhost:5432/brasa_brava
JWT_SECRET=...
JWT_EXPIRES_IN=8h
CORS_ORIGINS=http://localhost:5173
MAIL_DRIVER=console
BREVO_API_KEY=...
```

| Variable | Propósito |
|---|---|
| `PORT` | Puerto donde escucha el servidor |
| `NODE_ENV` | `production` exige un `JWT_SECRET` propio |
| `DATABASE_URL` | Conexión a PostgreSQL |
| `JWT_SECRET` | Clave de firma del token de sesión. Obligatoria en producción |
| `JWT_EXPIRES_IN` | Duración de la sesión (por defecto `8h`) |
| `CORS_ORIGINS` | Dominios del cliente web que pueden usar la API, separados por coma |
| `MAIL_DRIVER` | `console` muestra los códigos en la terminal; `brevo` envía correos reales |
| `BREVO_API_KEY` | Clave de Brevo, obligatoria con `MAIL_DRIVER=brevo` |
| `MAIL_FROM_EMAIL` / `MAIL_FROM_NAME` | Remitente de los correos |
| `RESET_CODE_TTL_MINUTES` | Minutos de vigencia del código de recuperación (por defecto 10) |
| `RESET_CODE_MAX_ATTEMPTS` | Intentos antes de bloquear el código (por defecto 5) |
| `RATE_LIMIT_ENABLED` | `false` desactiva el límite de intentos por IP (solo para pruebas) |
| `STATIC_DIR` | Opcional. Carpeta del frontend compilado para servirlo desde la API |
| `UPLOADS_DIR` | Carpeta donde se guardan las imágenes subidas (por defecto `uploads`) |
| `TIMEZONE` | Zona horaria del local para saber qué día es hoy (por defecto `America/La_Paz`) |

La configuración se valida con Zod al arrancar: si falta una variable obligatoria o tiene formato inválido, el servidor no inicia e indica cuál corregir.

## Ejecución

```bash
npm run db:seed    # aplica migraciones y carga los datos de prueba
npm run dev        # con recarga automática
npm start          # producción
npm test           # pruebas automáticas (Vitest, carpeta tests/)
```

Las migraciones se aplican solas cada vez que arranca el servidor (ver `database/README.md`).

## Stack

| Tecnología | Propósito |
|---|---|
| Express 5 | Enrutamiento y middlewares HTTP |
| pg | Acceso a PostgreSQL con consultas parametrizadas |
| Zod | Validación de variables de entorno y de cada petición |
| jsonwebtoken | Emisión y verificación de tokens de sesión |
| bcryptjs | Cifrado de contraseñas y códigos de verificación |
| Brevo | Correo transaccional |
| Helmet + CORS | Cabeceras de seguridad y control de orígenes |
| express-rate-limit | Límite de intentos de ingreso y de recuperación de contraseña |
| Vitest + Supertest + pg-mem | Pruebas de la API con base en memoria o PostgreSQL real |

No se emplea ORM: las consultas SQL viven en el repositorio de cada módulo.

## Arquitectura

Arquitectura en capas con responsabilidades delimitadas. Toda petición atraviesa la misma secuencia.

```
Petición HTTP
   ▼
Router          Declara la ruta y encadena los middlewares
   ▼
Middleware      Autenticación, permisos, validación y límites
   ▼
Controller      Lee la petición, delega, formatea la respuesta
   ▼
Service         Reglas de negocio
   ▼
Repository      Consultas SQL
   ▼
PostgreSQL      Persistencia
```

| Capa | Responsabilidad | Restricción |
|---|---|---|
| Router | Asociar ruta y verbo con su controlador | No contiene lógica |
| Middleware | Validar sesión, permisos y datos de entrada | No accede a reglas de negocio |
| Controller | Leer la petición, invocar el servicio, responder | No consulta la base de datos |
| Service | Validar reglas, orquestar | No conoce `req` ni `res` |
| Repository | Ejecutar consultas parametrizadas | No contiene reglas de negocio |

Un servicio ante un error de negocio retorna `{error, status}`, que el controlador traduce al código HTTP. La base, el correo y la configuración se inyectan en `createApp`, por eso las pruebas usan una base en memoria sin tocar la real.

## Estructura

```
src/
├── config/env.js            Variables de entorno validadas
├── db/
│   ├── pool.js                Conexión y transacciones
│   ├── migrate.js             Aplicación de migraciones pendientes
│   └── seed.js                Datos de prueba
├── modules/
│   ├── auth/                  routes, controller, service, repository, schemas,
│   │                          permisos por pantalla y plantilla del correo
│   ├── employees/             Gestión de empleados
│   ├── categories/            Categorías, subcategorías e imagen
│   ├── products/              Productos: precio, foto, disponibilidad y estado
│   ├── ingredients/           Insumos de stock, movimientos e historial
│   ├── sections/              Secciones del local y sus mesas
│   ├── promotions/            Promociones: combos y descuentos con vigencia
│   ├── sales/                 Caja: plano de mesas, catálogo del día y registro de pedidos
│   ├── kitchen/               Cocina: envíos de las ventas abiertas y unidades listas
│   ├── settings/              Ajustes del local (enlace a la página de impuestos)
│   └── shared/                Acciones de foto y sincronización de hijos (subcategorías, mesas)
│   └── roles/                 Cargos para formularios y filtros
├── middlewares/
│   ├── auth.js                Token de sesión y permisos por pantalla
│   ├── validate.js            Validación de la petición con Zod
│   ├── upload.js              Recepción de una imagen (multipart, máx. 5 MB)
│   └── errorHandler.js        Respuesta uniforme ante errores
├── services/
│   ├── mailer.js              Correo por consola (desarrollo) o Brevo
│   └── imageStorage.js        Guardado de imágenes validando su formato real
├── utils/                   Hash, tokens, códigos, errores HTTP, respuesta de servicios y parámetros de listados
├── scripts/                 migrate y seed para npm run
├── app.js                   Configuración de Express (seguridad, CORS, rutas)
└── server.js                Arranque del servidor

database/migrations/         Scripts SQL del esquema (ver database/README.md)
tests/                       Pruebas de la API y unitarias
```

## Rutas

| Método | Ruta | Alcance |
|---|---|---|
| `POST` | `/api/auth/login` | Inicio de sesión. Con usuario `DIRECTORIO` entra el dueño del local |
| `GET` | `/api/auth/me` | Perfil de la sesión actual |
| `GET` | `/api/auth/login-users` | Empleados activos para el carrusel del login (alias, nombre, cargo y foto) |
| `POST` | `/api/auth/password-reset/request` | Envía un código de 6 dígitos al correo del empleado |
| `POST` | `/api/auth/password-reset/verify` | Verifica el código sin consumirlo |
| `POST` | `/api/auth/password-reset/confirm` | Cambia la contraseña con el código verificado |
| `GET` | `/api/employees` | Empleados con búsqueda (`search`, por nombre, usuario o CI), filtro por cargo (`idCargo`) y los parámetros comunes de listado. Orden: `nombre`, `ci`, `cargo`, `usuario`, `estado` |
| `GET` | `/api/employees/:id` | Detalle de un empleado |
| `POST` | `/api/employees` | Registra un empleado con su contraseña inicial |
| `PUT` | `/api/employees/:id` | Modifica un empleado; la contraseña solo cambia si se envía |
| `PATCH` | `/api/employees/:id/status` | Da de baja (`{activo: false}`) o reactiva a un empleado |
| `GET` | `/api/roles` | Cargos activos |
| `GET` | `/api/categories` | Categorías con sus subcategorías activas; búsqueda (`search`, también por subcategoría) y los parámetros comunes de listado. Orden: `nombre`, `productos`, `estado` |
| `GET` | `/api/categories/:id` | Detalle de una categoría |
| `POST` | `/api/categories` | Registra una categoría con sus subcategorías |
| `PUT` | `/api/categories/:id` | Modifica la categoría y sincroniza sus subcategorías |
| `PATCH` | `/api/categories/:id/status` | Da de baja (`{activo: false}`) o reactiva una categoría |
| `PUT` | `/api/categories/:id/image` | Sube o reemplaza la foto (`multipart/form-data`, campo `imagen`) |
| `DELETE` | `/api/categories/:id/image` | Quita la foto |
| `GET` | `/api/products` | Productos con categoría y subcategoría; búsqueda (`search`, nombre o descripción), `idCategoria`, `idSubcategoria`, `disponibilidad` (`todos`, `disponibles`, `agotados`) y los parámetros comunes. Orden: `nombre`, `precio`, `categoria`, `estado` |
| `GET` | `/api/products/options` | Categorías activas con sus subcategorías activas, para el formulario y los filtros |
| `GET` | `/api/products/:id` | Detalle de un producto |
| `POST` | `/api/products` | Registra un producto |
| `PUT` | `/api/products/:id` | Modifica un producto |
| `PATCH` | `/api/products/:id/status` | Da de baja (`{activo: false}`) o reactiva un producto |
| `PATCH` | `/api/products/:id/availability` | Marca como agotado (`{disponible: false}`) o disponible |
| `GET` | `/api/products/recipe-options` | Insumos activos para armar recetas |
| `GET` | `/api/products/:id/recipe` | Receta del producto con el stock de cada insumo y las porciones que alcanzan |
| `PUT` | `/api/products/:id/recipe` | Reemplaza la receta completa (`{ingredientes: [{idInsumo, cantidad}]}`); una lista vacía la quita |
| `PUT` | `/api/products/:id/image` | Sube o reemplaza la foto (`multipart/form-data`, campo `imagen`) |
| `DELETE` | `/api/products/:id/image` | Quita la foto |
| `GET` | `/api/ingredients` | Insumos con su nivel (`suficiente`, `bajo`, `sin_stock`); búsqueda, `nivel` (`todos`, `bajo`, `sin_stock`) y los parámetros comunes. Orden: `nombre`, `stock`, `estado`. Incluye `summary` con totales de alertas |
| `GET` | `/api/ingredients/:id` | Detalle de un insumo |
| `POST` | `/api/ingredients` | Registra un insumo con `stockInicial` opcional (queda como primera entrada del historial) |
| `PUT` | `/api/ingredients/:id` | Modifica nombre, unidad y stock mínimo |
| `PATCH` | `/api/ingredients/:id/status` | Da de baja o reactiva un insumo |
| `POST` | `/api/ingredients/:id/movements` | Registra una entrada, salida o ajuste (`{tipo, cantidad, motivo}`) |
| `GET` | `/api/ingredients/:id/movements` | Historial de movimientos, del más reciente al más antiguo (`page`, `pageSize`) |
| `GET` | `/api/sections` | Secciones con sus mesas activas, total de mesas y personas; búsqueda (también por mesa) y los parámetros comunes. Orden: `nombre`, `mesas`, `capacidad`, `estado`. Incluye `summary` del local |
| `GET` | `/api/sections/:id` | Detalle de una sección |
| `POST` | `/api/sections` | Registra una sección con sus mesas |
| `PUT` | `/api/sections/:id` | Modifica la sección y sincroniza sus mesas |
| `PATCH` | `/api/sections/:id/status` | Da de baja o reactiva una sección |
| `GET` | `/api/promotions` | Promociones con productos, precio regular, precio con promoción, ahorro y vigencia de hoy; búsqueda (también por producto), `tipo`, `vigencia` (`todos`, `vigentes`, `programadas`, `vencidas`) y los parámetros comunes. Orden: `nombre`, `inicio`, `estado`. Incluye `summary` y `hoy` |
| `GET` | `/api/promotions/product-options` | Productos activos para armar promociones |
| `GET` | `/api/promotions/:id` | Detalle de una promoción |
| `POST` | `/api/promotions` | Registra una promoción |
| `PUT` | `/api/promotions/:id` | Modifica una promoción y reemplaza sus productos |
| `PATCH` | `/api/promotions/:id/status` | Da de baja o reactiva una promoción |
| `PUT` | `/api/promotions/:id/image` | Sube o reemplaza la foto |
| `DELETE` | `/api/promotions/:id/image` | Quita la foto |
| `GET` | `/api/sales/floor` | Secciones activas con sus mesas, la venta abierta de cada una (total, unidades, mesero, hora de apertura) y `summary` (`mesas`, `ocupadas`, `libres`, `porCobrar`) |
| `GET` | `/api/sales/catalog` | Lo que se vende hoy: categorías, productos activos con disponibilidad, porciones e ingredientes de su receta, y promociones vigentes hoy con su precio y productos |
| `GET` | `/api/sales/waiters` | Empleados activos que pueden atender mesas (su cargo tiene acceso a Caja) |
| `GET` | `/api/sales/tables/:idMesa` | Mesa con su sección y su venta abierta (`null` si está libre) con todas sus líneas agrupables por envío |
| `POST` | `/api/sales/tables/:idMesa/orders` | Registra un envío a cocina: abre la venta si la mesa está libre o suma las líneas a la abierta, y descuenta el stock. Responde `nueva`, el número de `envio` y `sinStock` (insumos que no alcanzaron) |
| `POST` | `/api/sales/tables/:idMesa/checkout` | Cobra la venta abierta de la mesa: `pagos` (`efectivo`, `qr` o ambos, con `monto`) y `recibido` opcional (efectivo entregado). Responde el `ticket` |
| `GET` | `/api/sales/:idVenta/receipt` | Ticket de una venta para reimprimirlo |
| `GET` | `/api/sales/today` | Ventas cobradas hoy (día del local) con sus pagos y `resumen` (`cantidad`, `total`, `efectivo`, `qr`) |
| `GET` | `/api/settings` | Ajustes del local (`enlaceImpuestos`); cualquier sesión |
| `PUT` | `/api/settings` | Cambia el enlace a la página de impuestos (permiso `administracion`) |
| `GET` | `/api/kitchen/orders` | Envíos de las ventas abiertas (mesa, sección, mesero, hora, `modificadoPor`, líneas sin precios con `listos`) con su `estado` (`preparacion` o `listo`): primero los que más esperan, después los listos más recientes. Incluye `summary` |
| `PATCH` | `/api/kitchen/lines/:id` | Cambia las unidades listas de una línea: `accion` = `sumar`, `restar`, `todos` o `ninguno`. Responde la lista actualizada |
| `PATCH` | `/api/kitchen/shipments/:idVenta/:envio` | Marca todo el envío como listo (`todos`) o lo devuelve a preparación (`ninguno`) |
| `GET` | `/uploads/:archivo` | Imágenes subidas |
| `GET` | `/api/health` | Estado de la API y de la base |

Las rutas de empleados y cargos exigen el permiso `empleados`; las de categorías, el permiso `categorias`; las de productos, el permiso `productos`; las de insumos, el permiso `stock`; las de secciones, el permiso `secciones`; las de promociones, el permiso `promociones`; las de Caja, el permiso `caja`; las de cocina, el permiso `cocina`.

### Parámetros comunes de los listados

Todos los listados aceptan los mismos parámetros (definidos una sola vez en `utils/listQuery.js`) y responden `{items, total, page, pageSize}`:

| Parámetro | Valores | Por defecto |
|---|---|---|
| `search` | Texto de hasta 60 caracteres | Vacío |
| `estado` | `todos`, `activos`, `inactivos` | `todos` |
| `page` | Número de página desde 1 | `1` |
| `pageSize` | Filas por página, hasta 50 | `5` |
| `sort` | Una de las columnas permitidas del módulo | Activos primero y por nombre |
| `dir` | `asc` o `desc` | `asc` |

El orden se arma con una lista blanca de columnas por módulo: un `sort` que no está en la lista responde 400 y nunca llega al SQL.

### Reglas de la gestión de empleados

- El CI, el usuario y el correo no se pueden repetir; el usuario y el correo se guardan en minúsculas.
- Un empleado dado de baja no puede iniciar sesión ni aparece en el carrusel del login, pero conserva su historial y se puede reactivar.
- Nadie puede darse de baja a sí mismo; el DIRECTORIO sí puede dar de baja a cualquier empleado.

### Reglas de la gestión de categorías

- El nombre de la categoría no se repite (sin distinguir mayúsculas). Cada categoría tiene entre 1 y 20 subcategorías sin nombres repetidos.
- Al modificar se envía la lista completa de subcategorías: las que traen `id` se renombran, las nuevas se crean y las que faltan se dan de baja (no se borran, para no perder el historial de productos).
- Las imágenes se aceptan solo si sus primeros bytes son de PNG, JPG o WEBP (no se confía en la extensión), pesan hasta 5 MB y se guardan con un nombre aleatorio. Al reemplazar o quitar una foto se borra el archivo anterior.

### Reglas de la gestión de productos

- Cada producto pertenece a una subcategoría, y por ella a una categoría. Al registrar o cambiar de subcategoría, la subcategoría y su categoría deben estar activas; conservar la que ya tenía siempre se permite aunque se haya dado de baja.
- El nombre no se repite (sin distinguir mayúsculas). El precio es mayor a 0, con hasta 2 decimales, y acepta coma o punto decimal.
- **Estado** (`activo`) y **disponibilidad** (`disponible`) son distintos: dar de baja saca el producto del menú; agotado es temporal (se acabó por hoy) y lo cambia el interruptor de la tabla.
- La cantidad de productos de cada categoría cuenta solo los productos activos.
- **Receta**: cantidad de cada insumo por porción (hasta 3 decimales, sin repetir insumos). Los insumos nuevos deben estar activos; uno dado de baja que ya estaba se puede conservar.
- **Porciones** (`porciones` en cada producto): cuántas se pueden preparar con el stock actual, según el insumo más escaso; un insumo de baja cuenta como sin stock. Es `null` si el producto no tiene receta.

### Reglas de la gestión de stock

- El stock solo cambia con movimientos, y cada uno queda en el historial con la cantidad (con signo), el stock resultante, el motivo y quién lo hizo (el empleado de la sesión o el DIRECTORIO).
- **Entrada** suma, **salida** resta y **ajuste** fija el conteo real (registra la diferencia). Una salida nunca deja el stock negativo: la resta se hace en una sola sentencia que falla si no alcanza, así dos ventas simultáneas no pueden pasarse.
- Cantidades con hasta 3 decimales (acepta coma) en `kg`, `g`, `l`, `ml` o `unidad`. La unidad no se puede cambiar una vez que hay movimientos.
- **Nivel**: sin stock (0), bajo (en o por debajo del mínimo) o suficiente. Los insumos dados de baja no cuentan en el resumen ni admiten movimientos.
- El tipo `venta` lo registra Caja al enviar cada pedido a cocina (ver Reglas de Caja).

### Reglas de secciones y mesas

- El nombre de la sección no se repite. Cada sección tiene entre 1 y 50 mesas, sin nombres repetidos dentro de la sección, de 1 a 30 personas cada una.
- Al modificar se envía la lista completa de mesas: las que traen `id` se actualizan, las nuevas se crean y las que faltan se dan de baja (no se borran, para conservar el historial de pedidos). La misma regla usan las subcategorías (`modules/shared/syncChildren.js`).
- El resumen cuenta solo secciones activas y sus mesas activas.

### Reglas de promociones

- **Combo**: varios productos con cantidad (al menos 2 unidades en total) a un precio fijo, que debe ser menor que comprarlos por separado. **Descuento**: porcentaje entero de 1 a 90 sobre uno o más productos.
- Vigencia por fechas (`fechaInicio`, `fechaFin` opcional) y días de la semana (`dias`: siete dígitos 1/0 de domingo a sábado, por ejemplo `0010000` = solo martes).
- Estados del día: `vigente`, `otro_dia` (dentro de fechas pero hoy no aplica), `programada`, `vencida` o `inactiva`. "Hoy" se calcula en la zona horaria del local (`TIMEZONE`), no en la del servidor: a las 23:30 del miércoles en La Paz sigue siendo miércoles aunque en UTC ya sea jueves.
- Los precios se calculan con el precio actual de cada producto. Los productos nuevos deben estar activos; uno dado de baja que ya estaba se puede conservar.
- Las fechas (`DATE`) viajan como texto `YYYY-MM-DD`, sin zona horaria, para que no se corran un día.

### Reglas de Caja

- Una mesa ocupada tiene una sola venta abierta: un nuevo envío a esa mesa se suma a la misma venta, no crea otra. El id de la venta es su número correlativo y nunca retrocede.
- Dos envíos al mismo tiempo para una mesa libre terminan en una sola venta: la fila de la mesa se bloquea durante la transacción, un índice único impide dos ventas abiertas y, si aun así chocan, el segundo se reintenta sumándose a la venta del primero.
- Cada línea guarda el nombre y el precio del momento (si el producto cambia de precio después, la venta no cambia), la cantidad (1 a 99), el consumo (`local` o `llevar`), el número de envío y el mesero de ese envío. La venta guarda además el mesero que abrió la mesa y el cajero de la sesión (o el DIRECTORIO).
- El precio lo calcula siempre el servidor: el de cada producto y, en promociones, el mismo cálculo que la pantalla de promociones (`modules/promotions/promotionRules.js`). Una promoción se vende solo si está vigente hoy y todos sus productos se pueden vender.
- Se pueden quitar ingredientes solo de la receta de cada producto; en un combo, de la receta de cada producto del combo. No hay extras con costo: lo adicional se vende como un producto más (por ejemplo, de "Guarniciones y Extras").
- No se venden productos agotados ni de baja. El stock **no bloquea** la venta: el catálogo avisa "Sin stock" o "Quedan N", pero el pedido se registra igual.
- No se puede dar de baja una sección ni quitar una mesa que tenga una venta abierta.
- Cada envío es una comanda (`venta_envio`): guarda su número, el cajero, el mesero y la hora. La venta trae `comandas` y, en las líneas de promoción, los `productos` del combo. Desde el segundo envío la venta queda `modificado` con `modificadoPor` = cajero del último envío.
- **Stock**: cada envío descuenta la receta de cada producto por su cantidad (en combos, la de cada producto del combo), sin los ingredientes quitados, con un movimiento `venta` en el historial (`Venta Nº 7 · Mesa 2 · envío 2`). Si no alcanza, el insumo queda en 0, el movimiento dice "(stock insuficiente)" y la respuesta lo avisa en `sinStock`, pero la venta se registra igual. Los insumos dados de baja no se tocan. Los insumos se bloquean en orden de id durante la transacción para que dos envíos no se pisen.

### Reglas del cobro

- Solo se cobra una venta abierta sin unidades pendientes en cocina (409 "Faltan N unidades por marcar como listas en cocina").
- Los pagos (uno por método, efectivo y/o QR) deben sumar exactamente el total. `recibido` solo se usa con efectivo, debe cubrir la parte en efectivo y da el `cambio`; sin `recibido` el efectivo se toma exacto.
- Todo pasa en una transacción con la mesa bloqueada: la venta queda `cobrada` con la hora de cierre y quién cobró, se guardan los pagos y la mesa queda libre. Un segundo cobro de la misma mesa responde 404.
- El ticket junta las líneas iguales (mismo nombre, precio y consumo) y lleva todo lo acumulado de la mesa, los pagos, lo recibido, el cambio y "MODIFICADO POR" si hubo más de un envío.
- "Hoy" para las ventas del día es el día del local (`TIMEZONE`): se convierte a un rango UTC (`utils/calendar.js`, `localDayRange`).

### Reglas de cocina

- Cada línea guarda cuántas unidades ya están listas (`listos`, de 0 a la cantidad pedida). Sumar y restar se hacen en una sola sentencia que nunca pasa de la cantidad ni baja de 0, así dos cocineros tocando a la vez no se pisan.
- Un envío está **listo** cuando todas sus unidades lo están; si se desmarca una, vuelve solo a **preparación**.
- Solo se cambian líneas de ventas abiertas. Caja ve el avance en cada línea (`listos`) y en el plano de mesas (`listos` de la venta).
- La pantalla `cocina` es nueva: la migración se la da a los cargos Administrador y Cocinero que ya existían.

## Autorización

Cada cargo tiene asignadas las pantallas a las que accede (tabla `cargo_permiso`). El token de sesión lleva esa lista, y cada ruta protegida la verifica con el middleware `authorize(pantalla)`. El DIRECTORIO tiene acceso a todas las pantallas.

| Pantalla | Clave |
|---|---|
| Home | `home` (todos los cargos) |
| Familia, Caja, Cocina | `familia`, `caja`, `cocina` |
| Administración | `productos`, `secciones`, `stock`, `categorias`, `promociones`, `empleados` |

## Sesión y seguridad

- Contraseñas y códigos de verificación se guardan cifrados con bcrypt.
- Ante usuario o contraseña incorrectos se responde siempre el mismo mensaje, y el tiempo de respuesta no revela si el usuario existe.
- Pedir un código responde igual exista o no el correo.
- El código vence a los 10 minutos, se bloquea tras 5 intentos fallidos y pedir uno nuevo anula el anterior.
- Límite de intentos por IP en el ingreso y en la recuperación de contraseña.
- Las respuestas de error nunca exponen detalles internos.

## Pruebas

```bash
npm test                  # base en memoria (pg-mem), no necesita PostgreSQL
npm run test:coverage     # con reporte de cobertura
```

Para correrlas contra PostgreSQL real (como en GitHub Actions):

```bash
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/brasa_test npm test
```

`TEST_DATABASE_URL` borra y vuelve a crear el esquema de esa base: usar una base solo para pruebas.
