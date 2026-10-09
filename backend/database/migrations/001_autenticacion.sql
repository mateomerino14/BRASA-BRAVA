-- Módulo de autenticación: cargos, permisos por pantalla, empleados,
-- usuario DIRECTORIO y códigos de recuperación de contraseña.

CREATE TABLE cargo (
    id_cargo     SERIAL PRIMARY KEY,
    nombre       VARCHAR(40) NOT NULL UNIQUE,
    activo       BOOLEAN NOT NULL DEFAULT TRUE
);

-- Pantallas del sidebar a las que tiene acceso cada cargo (ej: 'caja', 'productos').
CREATE TABLE cargo_permiso (
    id_cargo     INTEGER NOT NULL REFERENCES cargo(id_cargo) ON DELETE CASCADE,
    pantalla     VARCHAR(40) NOT NULL,
    PRIMARY KEY (id_cargo, pantalla)
);

CREATE TABLE empleado (
    id_empleado      SERIAL PRIMARY KEY,
    nombre           VARCHAR(60) NOT NULL,
    apellido         VARCHAR(60) NOT NULL,
    ci               VARCHAR(20) NOT NULL UNIQUE,
    alias            VARCHAR(30) NOT NULL UNIQUE,
    correo           VARCHAR(120) NOT NULL UNIQUE,
    telefono         VARCHAR(20),
    contrasena_hash  VARCHAR(100) NOT NULL,
    foto_url         TEXT,
    id_cargo         INTEGER NOT NULL REFERENCES cargo(id_cargo) ON DELETE RESTRICT,
    activo           BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cuenta única del dueño del local, con acceso total.
CREATE TABLE directorio (
    id_directorio    SERIAL PRIMARY KEY,
    alias            VARCHAR(30) NOT NULL,
    correo           VARCHAR(120),
    contrasena_hash  VARCHAR(100) NOT NULL
);

-- Códigos de 6 dígitos para recuperar contraseña. Se guarda solo el hash del código.
CREATE TABLE codigo_recuperacion (
    id_codigo        SERIAL PRIMARY KEY,
    id_empleado      INTEGER NOT NULL REFERENCES empleado(id_empleado) ON DELETE CASCADE,
    codigo_hash      VARCHAR(100) NOT NULL,
    intentos         INTEGER NOT NULL DEFAULT 0,
    usado            BOOLEAN NOT NULL DEFAULT FALSE,
    expira_en        TIMESTAMPTZ NOT NULL,
    creado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_codigo_recuperacion_empleado ON codigo_recuperacion (id_empleado, usado);
