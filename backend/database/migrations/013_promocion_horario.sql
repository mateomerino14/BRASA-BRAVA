-- Horario opcional de una promoción dentro del día (HH:MM, hora del local). Sin horario vale todo el día.

ALTER TABLE promocion ADD COLUMN hora_inicio VARCHAR(5);
ALTER TABLE promocion ADD COLUMN hora_fin VARCHAR(5);
