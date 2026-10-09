# Base de datos - Brasa Brava Backend

Scripts SQL del esquema de PostgreSQL. No hace falta correrlos a mano: la API los aplica sola al arrancar.

## Orden de ejecucion

Los archivos de `migrations/` se aplican en orden alfabetico, una sola vez cada uno:

1. `001_autenticacion.sql` - cargos, permisos por pantalla, empleados, DIRECTORIO y codigos de recuperacion

La tabla `schema_migrations` guarda cuales ya se aplicaron, asi que una base nueva y una existente quedan siempre en el mismo estado.

## Como agregar un cambio

1. Crear un archivo nuevo con el siguiente numero (por ejemplo `002_productos.sql`).
2. Nunca editar una migracion que ya se subio: los locales que la aplicaron no volverian a correrla.

Se usan migraciones numeradas porque la aplicacion de escritorio se instala en cada local y se actualiza sola, sin que nadie corra scripts en la base.

## Datos de prueba

```bash
npm run db:seed
```

Carga los cargos, cinco empleados (uno de ellos dado de baja) y el DIRECTORIO, solo si la base esta vacia. Contrasenia de los empleados: `Brasa2026`. Contrasenia del DIRECTORIO: `Directorio2026`.

Solo para entornos de prueba, nunca en produccion.

## Tablas del sistema

| Tabla | Descripcion |
|---|---|
| cargo | Cargos del personal (Administrador, Cajero, Mesero, Cocinero) |
| cargo_permiso | Pantallas a las que accede cada cargo |
| empleado | Empleados del local, con alias de ingreso y correo |
| directorio | Cuenta unica del duenio, con acceso total |
| codigo_recuperacion | Codigos de 6 digitos para recuperar la contrasenia, guardados cifrados, con vencimiento e intentos |
| schema_migrations | Control interno de las migraciones aplicadas |
