-- Pantalla de cargos y permisos: la reciben los cargos que ya gestionan empleados.

INSERT INTO cargo_permiso (id_cargo, pantalla)
SELECT c.id_cargo, 'cargos' FROM cargo c
  JOIN cargo_permiso e ON e.id_cargo = c.id_cargo AND e.pantalla = 'empleados'
  LEFT JOIN cargo_permiso p ON p.id_cargo = c.id_cargo AND p.pantalla = 'cargos'
 WHERE p.id_cargo IS NULL;
