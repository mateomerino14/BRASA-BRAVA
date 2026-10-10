-- Productos del menú: cada uno pertenece a una subcategoría (y por ella a una categoría)
CREATE TABLE producto (
  id_producto SERIAL PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  descripcion VARCHAR(200),
  precio NUMERIC(10, 2) NOT NULL CHECK (precio > 0),
  id_subcategoria INTEGER NOT NULL REFERENCES subcategoria(id_subcategoria) ON DELETE RESTRICT,
  imagen_url TEXT,
  -- activo: dado de baja o no; disponible: agotado temporalmente (lo cambia caja o cocina)
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  disponible BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_producto_subcategoria ON producto (id_subcategoria, activo);
