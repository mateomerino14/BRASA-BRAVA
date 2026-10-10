-- Envíos a cocina de cada venta: quién lo registró, para qué mesero y cuándo (cada envío es una comanda)
CREATE TABLE venta_envio (
  id_venta INTEGER NOT NULL REFERENCES venta(id_venta) ON DELETE CASCADE,
  numero INTEGER NOT NULL CHECK (numero >= 1),
  id_cajero INTEGER REFERENCES empleado(id_empleado) ON DELETE SET NULL,
  cajero VARCHAR(60) NOT NULL,
  id_mesero INTEGER NOT NULL REFERENCES empleado(id_empleado) ON DELETE RESTRICT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_venta, numero)
);

-- Una venta queda "modificada" cuando se le suma un envío después del primero; se guarda el cajero del último cambio
ALTER TABLE venta ADD COLUMN modificado BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE venta ADD COLUMN modificado_por VARCHAR(60);

-- Envíos de las ventas registradas antes de esta tabla: se reconstruyen desde sus líneas
INSERT INTO venta_envio (id_venta, numero, id_cajero, cajero, id_mesero, creado_en)
SELECT d.id_venta, d.envio, v.id_cajero, v.cajero, MIN(d.id_mesero), MIN(d.creado_en)
  FROM venta_detalle d JOIN venta v ON v.id_venta = d.id_venta
 GROUP BY d.id_venta, d.envio, v.id_cajero, v.cajero;

UPDATE venta SET modificado = TRUE, modificado_por = cajero WHERE envios > 1;
