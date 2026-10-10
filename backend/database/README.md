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

La tabla `schema_migrations` guarda cuales ya se aplicaron, asi que una base nueva y una existente quedan siempre en el mismo estado.

## Como agregar un cambio

1. Crear un archivo nuevo con el siguiente numero (por ejemplo `007_promociones.sql`).
2. Nunca editar una migracion que ya se subio: los locales que la aplicaron no volverian a correrla.

Se usan migraciones numeradas porque la aplicacion de escritorio se instala en cada local y se actualiza sola, sin que nadie corra scripts en la base.

## Datos de prueba

```bash
npm run db:seed
```

Carga los cargos, cinco empleados (uno de ellos dado de baja), el DIRECTORIO y cuatro categorias con sus subcategorias (una dada de baja) doce productos (uno dado de baja y uno agotado) doce insumos con su inventario inicial (uno con stock bajo y dos sin stock) las recetas de ocho productos y cuatro secciones con 19 mesas (una seccion dada de baja). Cada bloque se carga solo si su tabla esta vacia. Contrasenia de los empleados: `Brasa2026`. Contrasenia del DIRECTORIO: `Directorio2026`.

Solo para entornos de prueba, nunca en produccion.

## Tablas del sistema

| Tabla | Descripcion |
|---|---|
| cargo | Cargos del personal (Administrador, Cajero, Mesero, Cocinero) |
| cargo_permiso | Pantallas a las que accede cada cargo |
| empleado | Empleados del local, con alias de ingreso y correo |
| directorio | Cuenta unica del duenio, con acceso total |
| codigo_recuperacion | Codigos de 6 digitos para recuperar la contrasenia, guardados cifrados, con vencimiento e intentos |
| categoria | Secciones del menu, con descripcion, foto y estado |
| subcategoria | Subdivisiones de cada categoria; se dan de baja en vez de borrarse |
| producto | Productos del menu: precio, foto, subcategoria, estado (activo) y disponibilidad (agotado) |
| insumo | Ingredientes y bebidas: unidad, stock actual (nunca negativo) y stock minimo |
| movimiento_stock | Historial de entradas, salidas, ajustes y ventas con cantidad con signo, stock resultante y responsable |
| receta | Insumos de cada producto y cantidad por porcion; se borra con el producto |
| seccion | Ambientes del local (salon, terraza, barra) |
| mesa | Mesas de cada seccion con su capacidad; se dan de baja en vez de borrarse |
| schema_migrations | Control interno de las migraciones aplicadas |
