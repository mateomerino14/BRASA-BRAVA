-- Ventas: una venta abierta por mesa ocupada; su id es el número correlativo del ticket y nunca retrocede
CREATE TABLE venta (
  id_venta SERIAL PRIMARY KEY,
  id_mesa INTEGER NOT NULL REFERENCES mesa(id_mesa) ON DELETE RESTRICT,
  -- Mesero que abrió la mesa; cada detalle guarda además el mesero de su envío
  id_mesero INTEGER NOT NULL REFERENCES empleado(id_empleado) ON DELETE RESTRICT,
  -- Cajero de la sesión que abrió la venta (vacío si fue el DIRECTORIO)
  id_cajero INTEGER REFERENCES empleado(id_empleado) ON DELETE SET NULL,
  cajero VARCHAR(60) NOT NULL,
  estado VARCHAR(10) NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cobrada', 'anulada')),
  total NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  envios INTEGER NOT NULL DEFAULT 0,
  abierta_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cerrada_en TIMESTAMPTZ
);

-- Una mesa no puede tener dos ventas abiertas a la vez
CREATE UNIQUE INDEX ux_venta_mesa_abierta ON venta (id_mesa) WHERE estado = 'abierta';
CREATE INDEX idx_venta_estado ON venta (estado, abierta_en);

-- Líneas de la venta: un producto o una promoción con su precio del momento, cantidad y tipo de consumo
CREATE TABLE venta_detalle (
  id_detalle SERIAL PRIMARY KEY,
  id_venta INTEGER NOT NULL REFERENCES venta(id_venta) ON DELETE CASCADE,
  -- Número de envío dentro de la venta: la comanda de cocina lleva solo las líneas del último
  envio INTEGER NOT NULL CHECK (envio >= 1),
  id_producto INTEGER REFERENCES producto(id_producto) ON DELETE RESTRICT,
  id_promocion INTEGER REFERENCES promocion(id_promocion) ON DELETE RESTRICT,
  nombre VARCHAR(60) NOT NULL,
  precio_unitario NUMERIC(10, 2) NOT NULL CHECK (precio_unitario >= 0),
  cantidad INTEGER NOT NULL CHECK (cantidad BETWEEN 1 AND 99),
  consumo VARCHAR(6) NOT NULL CHECK (consumo IN ('local', 'llevar')),
  id_mesero INTEGER NOT NULL REFERENCES empleado(id_empleado) ON DELETE RESTRICT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((id_producto IS NULL) <> (id_promocion IS NULL))
);

CREATE INDEX idx_venta_detalle_venta ON venta_detalle (id_venta, envio);

-- Ingredientes que se quitan de una línea ("sin cebolla"); en un combo indican a qué producto del combo
CREATE TABLE venta_detalle_exclusion (
  id_detalle INTEGER NOT NULL REFERENCES venta_detalle(id_detalle) ON DELETE CASCADE,
  id_producto INTEGER NOT NULL REFERENCES producto(id_producto) ON DELETE RESTRICT,
  id_insumo INTEGER NOT NULL REFERENCES insumo(id_insumo) ON DELETE RESTRICT,
  PRIMARY KEY (id_detalle, id_producto, id_insumo)
);
