-- El pedido ya no lleva mesero: solo queda el cajero que registra cada envío
ALTER TABLE venta_detalle DROP COLUMN id_mesero;
ALTER TABLE venta_envio DROP COLUMN id_mesero;
ALTER TABLE venta DROP COLUMN id_mesero;
