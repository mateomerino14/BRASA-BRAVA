-- Insumos (ingredientes y bebidas) con su stock actual y el mínimo que dispara la alerta
CREATE TABLE insumo (
  id_insumo SERIAL PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL,
  unidad VARCHAR(10) NOT NULL CHECK (unidad IN ('kg', 'g', 'l', 'ml', 'unidad')),
  stock_actual NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
  stock_minimo NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Historial de cada cambio de stock: cantidad con signo, stock resultante y quién lo hizo
CREATE TABLE movimiento_stock (
  id_movimiento SERIAL PRIMARY KEY,
  id_insumo INTEGER NOT NULL REFERENCES insumo(id_insumo) ON DELETE RESTRICT,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste', 'venta')),
  cantidad NUMERIC(12, 3) NOT NULL,
  stock_resultante NUMERIC(12, 3) NOT NULL,
  motivo VARCHAR(160),
  id_empleado INTEGER REFERENCES empleado(id_empleado) ON DELETE SET NULL,
  responsable VARCHAR(60) NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_movimiento_insumo ON movimiento_stock (id_insumo, id_movimiento);
