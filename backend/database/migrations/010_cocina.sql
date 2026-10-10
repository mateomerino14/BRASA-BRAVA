-- Preparación en cocina: cuántas unidades de cada línea ya están listas; la línea vuelve a preparación si se desmarca
ALTER TABLE venta_detalle ADD COLUMN listos INTEGER NOT NULL DEFAULT 0;
ALTER TABLE venta_detalle ADD CONSTRAINT ck_venta_detalle_listos CHECK (listos >= 0 AND listos <= cantidad);

-- Nueva pantalla "cocina": la reciben los cargos que ya existían con esos nombres
INSERT INTO cargo_permiso (id_cargo, pantalla)
SELECT c.id_cargo, 'cocina' FROM cargo c
  LEFT JOIN cargo_permiso p ON p.id_cargo = c.id_cargo AND p.pantalla = 'cocina'
 WHERE c.nombre IN ('Administrador', 'Cocinero') AND p.id_cargo IS NULL;
