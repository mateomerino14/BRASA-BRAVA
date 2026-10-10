const notFound = {error: 'Insumo no encontrado', status: 404};
const duplicateName = {error: 'Ya existe un insumo con ese nombre', status: 409};
const unitLocked = {error: 'No se puede cambiar la unidad de un insumo que ya tiene movimientos', status: 409};
const notEnough = {error: 'No hay suficiente stock para esa salida', status: 400};
const inactive = {error: 'Reactive el insumo antes de registrar movimientos', status: 400};

const QUANTITY_DECIMALS = 3;

// Redondea a la precisión de la base para evitar restos como 0.30000000000000004
const round = (value) => Number(Number(value).toFixed(QUANTITY_DECIMALS));

// Nivel del stock: sin stock, bajo (en o por debajo del mínimo) o suficiente
export const levelOf = (actual, minimo) => {
  if (actual === 0) {
    return 'sin_stock';
  }
  if (actual <= minimo) {
    return 'bajo';
  }
  return 'suficiente';
};

// Convierte una fila de la base al formato que consume el frontend
const toIngredient = (row) => {
  const stockActual = round(row.stock_actual);
  const stockMinimo = round(row.stock_minimo);
  return {
    id: row.id_insumo,
    nombre: row.nombre,
    unidad: row.unidad,
    stockActual,
    stockMinimo,
    nivel: levelOf(stockActual, stockMinimo),
    activo: row.activo,
  };
};

const toMovement = (row) => ({
  id: row.id_movimiento,
  tipo: row.tipo,
  cantidad: round(row.cantidad),
  stockResultante: round(row.stock_resultante),
  motivo: row.motivo,
  responsable: row.responsable,
  fecha: row.creado_en,
});

// Quién hizo el movimiento: el empleado de la sesión o el DIRECTORIO
const authorOf = (user) => {
  if (user.isDirectorio) {
    return {idEmpleado: null, responsable: user.alias};
  }
  return {idEmpleado: user.id, responsable: user.alias};
};

// Reglas de negocio de insumos y movimientos de stock
export const createIngredientsService = ({repository, transaction}) => {
  // Devuelve el detalle de un insumo
  const getById = async (id) => {
    const row = await repository.findById(id);
    if (!row) {
      return notFound;
    }
    return {ingredient: toIngredient(row)};
  };

  // Devuelve una página del listado y el resumen de alertas
  const list = async (filters) => {
    const rows = await repository.list(filters);
    const total = await repository.count(filters);
    const summary = await repository.summary();
    return {
      items: rows.map(toIngredient),
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      summary: {total: summary.total, bajo: summary.bajo ?? 0, sinStock: summary.sin_stock ?? 0},
    };
  };

  // Registra un insumo y, si trae stock inicial, lo deja como primera entrada del historial
  const create = async ({stockInicial, ...data}, user) => {
    if (await repository.findByName(data.nombre)) {
      return duplicateName;
    }
    const id = await transaction(async (tx) => {
      const newId = await tx.insert(data);
      if (stockInicial > 0) {
        const stock = await tx.addStock(newId, stockInicial);
        await tx.insertMovement({idInsumo: newId, tipo: 'entrada', cantidad: stockInicial, stockResultante: stock, motivo: 'Stock inicial', ...authorOf(user)});
      }
      return newId;
    });
    return getById(id);
  };

  // Modifica nombre, unidad y mínimo; la unidad queda fija una vez que hay movimientos
  const update = async (id, data) => {
    const current = await repository.findById(id);
    if (!current) {
      return notFound;
    }
    if (await repository.findByName(data.nombre, id)) {
      return duplicateName;
    }
    if (data.unidad !== current.unidad && await repository.hasMovements(id)) {
      return unitLocked;
    }
    await repository.update(id, data);
    return getById(id);
  };

  // Da de baja o reactiva un insumo
  const setStatus = async (id, activo) => {
    if (!await repository.findById(id)) {
      return notFound;
    }
    await repository.setActive(id, activo);
    return getById(id);
  };

  // Entrada suma, salida resta (sin quedar negativo) y ajuste fija el conteo real; todo queda en el historial
  const addMovement = async (id, {tipo, cantidad, motivo}, user) => {
    const current = await repository.findById(id);
    if (!current) {
      return notFound;
    }
    if (!current.activo) {
      return inactive;
    }
    let delta = cantidad;
    if (tipo === 'salida') {
      delta = -cantidad;
    }
    if (tipo === 'ajuste') {
      delta = round(cantidad - Number(current.stock_actual));
    }
    const result = await transaction(async (tx) => {
      const stock = await tx.addStock(id, delta);
      if (stock === null) {
        return notEnough;
      }
      await tx.insertMovement({idInsumo: id, tipo, cantidad: delta, stockResultante: stock, motivo, ...authorOf(user)});
      return null;
    });
    if (result) {
      return result;
    }
    return getById(id);
  };

  // Devuelve una página del historial de movimientos
  const history = async (id, paging) => {
    if (!await repository.findById(id)) {
      return notFound;
    }
    const rows = await repository.movements(id, paging);
    const total = await repository.countMovements(id);
    return {items: rows.map(toMovement), total, page: paging.page, pageSize: paging.pageSize};
  };

  return {list, getById, create, update, setStatus, addMovement, history};
};
