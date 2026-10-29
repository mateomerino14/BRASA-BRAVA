-- Receta de cada producto: qué insumos usa y cuánto de cada uno por porción
CREATE TABLE receta (
  id_producto INTEGER NOT NULL REFERENCES producto(id_producto) ON DELETE CASCADE,
  id_insumo INTEGER NOT NULL REFERENCES insumo(id_insumo) ON DELETE RESTRICT,
  cantidad NUMERIC(12, 3) NOT NULL CHECK (cantidad > 0),
  PRIMARY KEY (id_producto, id_insumo)
);

CREATE INDEX idx_receta_insumo ON receta (id_insumo);
