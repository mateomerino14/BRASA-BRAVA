-- Promociones: descuento en porcentaje sobre productos o combo de varios productos a precio fijo
CREATE TABLE promocion (
  id_promocion SERIAL PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL,
  descripcion VARCHAR(200),
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('descuento', 'combo')),
  -- descuento: porcentaje de 1 a 90; combo: precio final del combo
  valor NUMERIC(10, 2) NOT NULL CHECK (valor > 0),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  -- Siete caracteres 1/0 de domingo a sábado: '0010000' = solo martes
  dias VARCHAR(7) NOT NULL DEFAULT '1111111',
  imagen_url TEXT,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);

CREATE TABLE promocion_producto (
  id_promocion INTEGER NOT NULL REFERENCES promocion(id_promocion) ON DELETE CASCADE,
  id_producto INTEGER NOT NULL REFERENCES producto(id_producto) ON DELETE RESTRICT,
  cantidad INTEGER NOT NULL DEFAULT 1 CHECK (cantidad BETWEEN 1 AND 20),
  PRIMARY KEY (id_promocion, id_producto)
);
