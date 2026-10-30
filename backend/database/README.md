# Base de datos - Brasa Brava Backend

Scripts SQL del esquema de PostgreSQL. No hace falta correrlos a mano: la API los aplica sola al arrancar.

## Orden de ejecucion

Los archivos de `migrations/` se aplican en orden alfabetico, una sola vez cada uno:

1. `001_autenticacion.sql` - cargos, permisos por pantalla, empleados, DIRECTORIO y codigos de recuperacion
2. `002_categorias.sql` - categorias del menu y sus subcategorias
3. `003_productos.sql` - productos del menu con precio, foto, estado y disponibilidad
4. `004_stock.sql` - insumos con stock actual y minimo, e historial de movimientos
5. `005_recetas.sql` - receta de cada producto (insumos y cantidad por porcion)
6. `006_secciones.sql` - secciones del local y sus mesas con capacidad
7. `007_promociones.sql` - promociones (combos y descuentos) con sus productos, fechas y dias
8. `008_ventas.sql` - ventas por mesa, sus lineas (producto o promocion, precio del momento, cantidad y consumo) y los ingredientes quitados
9. `009_comandas.sql` - envios a cocina de cada venta (cada envio es una comanda) y la marca de venta modificada
10. `010_cocina.sql` - unidades listas de cada linea
11. `011_cobro.sql` - cobro (quien cobro, recibido y cambio), pagos por metodo y configuracion del local
12. `012_cargos.sql` - pantalla de cargos para quienes ya gestionan empleados
13. `013_promocion_horario.sql` - horario opcional de las promociones
14. `014_caja_unificada.sql` - Caja y Cocina en una sola pantalla e impresiones del ticket
15. `015_autorizacion_caja.sql` - la reimpresion la autoriza cualquiera con Caja
16. `016_sin_mesero.sql` - el pedido deja de guardar mesero: esas columnas quedan vacias y opcionales
17. `017_reportes.sql` - pantalla de reportes y envios programados por correo
18. `018_contrasena_inicial.sql` - aviso para que el DIRECTORIO cambie la contrasena inicial

La tabla `schema_migrations` guarda cuales ya se aplicaron, asi que una base nueva y una existente quedan siempre en el mismo estado.

Despues de las migraciones, la API crea la cuenta del DIRECTORIO si la base no tiene ninguna (`src/db/bootstrap.js`), con la contrasena inicial `Directorio2026` y el aviso `cambiar_contrasena`: hasta que la cambie, solo puede ver su perfil y cambiar la contrasena. Asi un local nuevo arranca sin datos de prueba y con una sola cuenta para empezar a cargar todo.

## Como agregar un cambio

1. Crear un archivo nuevo con el siguiente numero (por ejemplo `019_reservas.sql`).
2. Nunca editar una migracion que ya se subio: los locales que la aplicaron no volverian a correrla.

Se usan migraciones numeradas porque la aplicacion de escritorio se instala en cada local y se actualiza sola, sin que nadie corra scripts en la base.

## Datos de prueba

```bash
npm run db:seed
```

Carga los cargos, cinco empleados (uno de ellos dado de baja), el DIRECTORIO y cuatro categorias con sus subcategorias (una dada de baja) doce productos (uno dado de baja y uno agotado) doce insumos con su inventario inicial (uno con stock bajo y dos sin stock) las recetas de ocho productos cuatro secciones con 19 mesas (una seccion dada de baja) cinco promociones con fechas relativas al dia en que se cargan (vigentes, programada, vencida e inactiva) y dos mesas ocupadas con su pedido en cocina (Mesa 2 y Terraza 1). Cada bloque se carga solo si su tabla esta vacia. Contrasenia de los empleados: `Brasa2026`. Contrasenia del DIRECTORIO: `Directorio2026`.

Solo para entornos de prueba, nunca en produccion.

## Tablas del sistema

| Tabla | Descripcion |
|---|---|
| cargo | Cargos del personal (Administrador, Cajero, Mesero, Cocinero) |
| cargo_permiso | Pantallas a las que accede cada cargo |
| empleado | Empleados del local, con alias de ingreso y correo |
| directorio | Cuenta unica del duenio, con acceso total; `cambiar_contrasena` marca que todavia tiene la contrasena inicial |
| codigo_recuperacion | Codigos de 6 digitos para recuperar la contrasenia, guardados cifrados, con vencimiento e intentos |
| categoria | Secciones del menu, con descripcion, foto y estado |
| subcategoria | Subdivisiones de cada categoria; se dan de baja en vez de borrarse |
| producto | Productos del menu: precio, foto, subcategoria, estado (activo) y disponibilidad (agotado) |
| insumo | Ingredientes y bebidas: unidad, stock actual (nunca negativo) y stock minimo |
| movimiento_stock | Historial de entradas, salidas, ajustes y ventas con cantidad con signo, stock resultante y responsable |
| receta | Insumos de cada producto y cantidad por porcion; se borra con el producto |
| seccion | Ambientes del local (salon, terraza, barra) |
| mesa | Mesas de cada seccion con su capacidad; se dan de baja en vez de borrarse |
| promocion | Combos a precio fijo y descuentos en porcentaje, con fechas, dias de la semana y foto |
| promocion_producto | Productos de cada promocion con su cantidad |
| venta | Venta de una mesa: estado (abierta, cobrada o anulada), total, cajero que la abrio, quien cobro, recibido y cambio. Su id es el numero del ticket |
| venta_detalle | Lineas de la venta: producto o promocion, nombre y precio del momento, cantidad, consumo (`local` o `llevar`), envio y unidades listas |
| venta_detalle_exclusion | Ingredientes quitados de una linea ("sin cebolla"); en un combo indica de que producto |
| venta_envio | Cada envio a cocina: numero, cajero que lo registro y hora |
| pago | Pagos de una venta, uno por metodo (efectivo o QR) |
| ticket_impresion | Cada impresion del ticket: quien lo imprimio y, desde la cuarta, quien la autorizo |
| configuracion | Ajustes del local, como el enlace a la pagina de impuestos |
| reporte_programado | Envios automaticos del reporte por correo: destino, tipo, dias, hora y como salio el ultimo |
| schema_migrations | Control interno de las migraciones aplicadas |
