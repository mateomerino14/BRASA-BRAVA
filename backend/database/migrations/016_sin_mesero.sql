-- El pedido ya no lleva mesero: solo queda el cajero que registra cada envío.
-- Las columnas quedan vacías y opcionales (el sistema ya no las usa); así ninguna venta queda atada a un mesero
ALTER TABLE venta_detalle ALTER COLUMN id_mesero DROP NOT NULL;
ALTER TABLE venta_envio ALTER COLUMN id_mesero DROP NOT NULL;
ALTER TABLE venta ALTER COLUMN id_mesero DROP NOT NULL;
UPDATE venta_detalle SET id_mesero = NULL;
UPDATE venta_envio SET id_mesero = NULL;
UPDATE venta SET id_mesero = NULL;
