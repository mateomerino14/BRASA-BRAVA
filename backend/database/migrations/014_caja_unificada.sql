-- Caja y Cocina pasan a ser una sola pantalla: cocina solo recibe la comanda impresa y el cajero marca lo que sale
DELETE FROM cargo_permiso WHERE pantalla = 'cocina';

-- Permiso para autorizar la reimpresión del ticket desde la cuarta vez; lo reciben los cargos que ya administran
INSERT INTO cargo_permiso (id_cargo, pantalla)
SELECT c.id_cargo, 'reimpresion' FROM cargo c
  JOIN cargo_permiso a ON a.id_cargo = c.id_cargo AND a.pantalla = 'administracion'
  LEFT JOIN cargo_permiso p ON p.id_cargo = c.id_cargo AND p.pantalla = 'reimpresion'
 WHERE p.id_cargo IS NULL;

-- Cada impresión del ticket de una venta: quién lo imprimió y, desde la cuarta, quién la autorizó
CREATE TABLE ticket_impresion (
  id_impresion SERIAL PRIMARY KEY,
  id_venta INTEGER NOT NULL REFERENCES venta(id_venta) ON DELETE CASCADE,
  numero INTEGER NOT NULL CHECK (numero > 0),
  id_empleado INTEGER REFERENCES empleado(id_empleado) ON DELETE SET NULL,
  impreso_por VARCHAR(60) NOT NULL,
  id_autorizador INTEGER REFERENCES empleado(id_empleado) ON DELETE SET NULL,
  autorizado_por VARCHAR(60),
  impreso_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id_venta, numero)
);
