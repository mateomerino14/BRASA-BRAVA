-- Categorías del menú y sus subcategorías. Se dan de baja en vez de borrarse
-- para que los productos ya registrados conserven su clasificación.

CREATE TABLE categoria (
    id_categoria  SERIAL PRIMARY KEY,
    nombre        VARCHAR(50) NOT NULL,
    descripcion   VARCHAR(160),
    imagen_url    TEXT,
    activa        BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE subcategoria (
    id_subcategoria  SERIAL PRIMARY KEY,
    id_categoria     INTEGER NOT NULL REFERENCES categoria(id_categoria) ON DELETE RESTRICT,
    nombre           VARCHAR(50) NOT NULL,
    activa           BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_subcategoria_categoria ON subcategoria (id_categoria, activa);
