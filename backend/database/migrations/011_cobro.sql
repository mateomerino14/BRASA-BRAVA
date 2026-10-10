-- Cobro de la venta: quién cobró, cuánto efectivo entregó el cliente y el cambio
ALTER TABLE venta ADD COLUMN id_cobrador INTEGER REFERENCES empleado(id_empleado) ON DELETE SET NULL;
ALTER TABLE venta ADD COLUMN cobrador VARCHAR(60);
ALTER TABLE venta ADD COLUMN recibido NUMERIC(10, 2);
ALTER TABLE venta ADD COLUMN cambio NUMERIC(10, 2);

-- Pagos de una venta: uno por método (efectivo, QR); un cobro mixto tiene los dos
CREATE TABLE pago (
  id_pago SERIAL PRIMARY KEY,
  id_venta INTEGER NOT NULL REFERENCES venta(id_venta) ON DELETE CASCADE,
  metodo VARCHAR(10) NOT NULL CHECK (metodo IN ('efectivo', 'qr')),
  monto NUMERIC(10, 2) NOT NULL CHECK (monto > 0),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pago_venta ON pago (id_venta);
CREATE INDEX idx_venta_cierre ON venta (estado, cerrada_en);

-- Ajustes del local que se cambian sin tocar código (por ejemplo, el enlace a la página de impuestos)
CREATE TABLE configuracion (
  clave VARCHAR(40) PRIMARY KEY,
  valor TEXT NOT NULL
);

INSERT INTO configuracion (clave, valor) VALUES ('enlace_impuestos', 'https://siat.impuestos.gob.bo/v2/launcher/');
