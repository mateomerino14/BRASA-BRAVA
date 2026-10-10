-- Secciones del local (salón, terraza, barra) y sus mesas con la cantidad de personas que admiten
CREATE TABLE seccion (
  id_seccion SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  descripcion VARCHAR(160),
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE mesa (
  id_mesa SERIAL PRIMARY KEY,
  id_seccion INTEGER NOT NULL REFERENCES seccion(id_seccion) ON DELETE RESTRICT,
  nombre VARCHAR(30) NOT NULL,
  capacidad INTEGER NOT NULL CHECK (capacidad BETWEEN 1 AND 30),
  activa BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_mesa_seccion ON mesa (id_seccion, activa);
