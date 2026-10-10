const lineNotFound = {error: 'La línea no existe o su pedido ya se cerró', status: 404};
const shipmentNotFound = {error: 'El envío no existe o su pedido ya se cerró', status: 404};

// Agrupa filas por una clave calculada: Map(clave → filas), en el orden en que aparecen
const groupBy = (rows, keyOf) => {
  const groups = new Map();
  for (const row of rows) {
    const key = keyOf(row);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(row);
  }
  return groups;
};

// Convierte una línea al formato de la pantalla de cocina
const toLine = (row, exclusions, combos) => {
  let tipo = 'producto';
  if (row.id_promocion) {
    tipo = 'promocion';
  }
  return {
    id: row.id_detalle,
    tipo,
    nombre: row.nombre,
    cantidad: row.cantidad,
    listos: row.listos,
    consumo: row.consumo,
    productos: (combos.get(row.id_promocion) ?? []).map((item) => ({nombre: item.nombre, cantidad: item.cantidad})),
    exclusiones: (exclusions.get(row.id_detalle) ?? []).map((item) => ({producto: item.producto, insumo: item.insumo})),
  };
};

// Reglas de la pantalla de cocina: envíos de las ventas abiertas y unidades listas por línea
export const createKitchenService = ({repository}) => {
  // Envíos de las ventas abiertas: primero los que esperan más; un envío está listo cuando todas sus unidades lo están
  const orders = async () => {
    const rows = await repository.openLines();
    const exclusions = groupBy(await repository.detailExclusions(rows.map((row) => row.id_detalle)), (row) => row.id_detalle);
    const promotionIds = [...new Set(rows.filter((row) => row.id_promocion).map((row) => row.id_promocion))];
    const combos = groupBy(await repository.promotionProducts(promotionIds), (row) => row.id_promocion);
    const shipments = [];
    for (const lines of groupBy(rows, (row) => `${row.id_venta}-${row.envio}`).values()) {
      const [first] = lines;
      const unidades = lines.reduce((total, row) => total + row.cantidad, 0);
      const listas = lines.reduce((total, row) => total + row.listos, 0);
      let estado = 'preparacion';
      if (listas === unidades) {
        estado = 'listo';
      }
      // Desde el segundo envío la comanda es una modificación del pedido
      let modificadoPor = null;
      if (first.envio > 1) {
        modificadoPor = first.cajero;
      }
      shipments.push({
        id: `${first.id_venta}-${first.envio}`,
        idVenta: first.id_venta,
        numero: first.id_venta,
        envio: first.envio,
        modificadoPor,
        mesa: first.mesa,
        seccion: first.seccion,
        mesero: `${first.mesero_nombre} ${first.mesero_apellido}`,
        creadoEn: first.creado_en,
        unidades,
        listas,
        estado,
        lineas: lines.map((row) => toLine(row, exclusions, combos)),
      });
    }
    const pending = shipments.filter((item) => item.estado === 'preparacion');
    const ready = shipments.filter((item) => item.estado === 'listo').reverse();
    return {
      envios: [...pending, ...ready],
      summary: {
        preparacion: pending.length,
        listos: ready.length,
        unidadesPendientes: pending.reduce((total, item) => total + item.unidades - item.listas, 0),
      },
    };
  };

  // Suma, resta o marca todas/ninguna de las unidades de una línea
  const markLine = async (idDetalle, accion) => {
    if (!await repository.updateLine(idDetalle, accion)) {
      return lineNotFound;
    }
    return orders();
  };

  // Marca un envío completo como listo o lo devuelve a preparación
  const markShipment = async (idVenta, envio, accion) => {
    if (await repository.updateShipment(idVenta, envio, accion) === 0) {
      return shipmentNotFound;
    }
    return orders();
  };

  return {orders, markLine, markShipment};
};
