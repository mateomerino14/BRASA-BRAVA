-- Pantalla de reportes: la reciben los cargos que ya administran
INSERT INTO cargo_permiso (id_cargo, pantalla)
SELECT c.id_cargo, 'reportes' FROM cargo c
  JOIN cargo_permiso a ON a.id_cargo = c.id_cargo AND a.pantalla = 'administracion'
  LEFT JOIN cargo_permiso p ON p.id_cargo = c.id_cargo AND p.pantalla = 'reportes'
 WHERE p.id_cargo IS NULL;

-- Envíos automáticos del reporte de ventas por correo (los programa el DIRECTORIO)
CREATE TABLE reporte_programado (
  id_programado SERIAL PRIMARY KEY,
  correo VARCHAR(120) NOT NULL,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('resumen', 'detalle')),
  dias VARCHAR(7) NOT NULL,
  hora VARCHAR(5) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Hora programada que ya se atendió, hasta dónde llegó el último reporte y cómo salió
  ultimo_turno TIMESTAMPTZ,
  ultimo_hasta TIMESTAMPTZ,
  ultimo_envio_en TIMESTAMPTZ,
  ultimo_atrasado BOOLEAN NOT NULL DEFAULT FALSE,
  ultimo_intento_en TIMESTAMPTZ,
  ultimo_error VARCHAR(200)
);
