-- La reimpresión del ticket la autoriza cualquier empleado con acceso a Caja (queda registrado quién):
-- el permiso aparte "reimpresion" ya no se usa
DELETE FROM cargo_permiso WHERE pantalla = 'reimpresion';
