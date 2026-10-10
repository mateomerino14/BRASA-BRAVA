import {createImageActions} from '../shared/imageActions.js';

const notFound = {error: 'Producto no encontrado', status: 404};
const duplicateName = {error: 'Ya existe un producto con ese nombre', status: 409};
const invalidSubcategory = {error: 'Seleccione una subcategoría activa', status: 400};
const invalidIngredient = {error: 'Hay insumos inexistentes o dados de baja en la receta', status: 400};

const QUANTITY_DECIMALS = 3;
const round = (value) => Number(Number(value).toFixed(QUANTITY_DECIMALS));

const toRecipeItem = (row) => ({
  idInsumo: row.id_insumo,
  nombre: row.nombre,
  unidad: row.unidad,
  cantidad: round(row.cantidad),
  stockActual: round(row.stock_actual),
  activo: row.activo,
});

// Convierte una fila de la base al formato que consume el frontend
const toProduct = (row) => ({
  id: row.id_producto,
  nombre: row.nombre,
  descripcion: row.descripcion,
  precio: Number(row.precio),
  imagenUrl: row.imagen_url,
  // null cuando el producto todavía no tiene receta
  porciones: row.porciones ?? null,
  activo: row.activo,
  disponible: row.disponible,
  categoria: {id: row.id_categoria, nombre: row.categoria, activa: row.categoria_activa},
  subcategoria: {id: row.id_subcategoria, nombre: row.subcategoria, activa: row.subcategoria_activa},
});

// Agrupa las filas de opciones en categorías con sus subcategorías
const toOptions = (rows) => {
  const categories = new Map();
  for (const row of rows) {
    if (!categories.has(row.id_categoria)) {
      categories.set(row.id_categoria, {id: row.id_categoria, nombre: row.categoria, subcategorias: []});
    }
    categories.get(row.id_categoria).subcategorias.push({id: row.id_subcategoria, nombre: row.subcategoria});
  }
  return [...categories.values()];
};

// Reglas de negocio de productos
export const createProductsService = ({repository, transaction, images}) => {
  // Devuelve el detalle de un producto
  const getById = async (id) => {
    const row = await repository.findById(id);
    if (!row) {
      return notFound;
    }
    return {product: toProduct(row)};
  };

  // Valida nombre único y que la subcategoría (y su categoría) estén activas; conservar la actual siempre se permite
  const checkRules = async (data, current) => {
    if (await repository.findByName(data.nombre, current?.id_producto)) {
      return duplicateName;
    }
    if (current?.id_subcategoria === data.idSubcategoria) {
      return null;
    }
    const subcategory = await repository.findSubcategory(data.idSubcategoria);
    if (!subcategory?.activa || !subcategory.categoria_activa) {
      return invalidSubcategory;
    }
    return null;
  };

  // Devuelve una página del listado con el total para la paginación
  const list = async (filters) => {
    const rows = await repository.list(filters);
    const total = await repository.count(filters);
    return {items: rows.map(toProduct), total, page: filters.page, pageSize: filters.pageSize};
  };

  // Categorías y subcategorías activas para elegir en el formulario
  const options = async () => ({categorias: toOptions(await repository.options())});

  // Registra un producto
  const create = async (data) => {
    const problem = await checkRules(data);
    if (problem) {
      return problem;
    }
    const id = await repository.insert(data);
    return getById(id);
  };

  // Modifica un producto
  const update = async (id, data) => {
    const current = await repository.findById(id);
    if (!current) {
      return notFound;
    }
    const problem = await checkRules(data, current);
    if (problem) {
      return problem;
    }
    await repository.update(id, data);
    return getById(id);
  };

  // Da de baja o reactiva un producto
  const setStatus = async (id, activo) => {
    if (!await repository.findById(id)) {
      return notFound;
    }
    await repository.setActive(id, activo);
    return getById(id);
  };

  // Marca un producto como disponible o agotado
  const setAvailability = async (id, disponible) => {
    if (!await repository.findById(id)) {
      return notFound;
    }
    await repository.setAvailable(id, disponible);
    return getById(id);
  };

  // Receta del producto con las porciones que alcanzan
  const getRecipe = async (id) => {
    const row = await repository.findById(id);
    if (!row) {
      return notFound;
    }
    const items = await repository.recipe(id);
    return {recipe: {ingredientes: items.map(toRecipeItem), porciones: row.porciones ?? null}};
  };

  // Insumos activos para elegir en la receta
  const recipeOptions = async () => ({
    insumos: (await repository.recipeOptions()).map((row) => ({id: row.id_insumo, nombre: row.nombre, unidad: row.unidad, stockActual: round(row.stock_actual)})),
  });

  // Reemplaza la receta; los insumos nuevos deben estar activos, los que ya estaban se pueden conservar
  const saveRecipe = async (id, {ingredientes}) => {
    if (!await repository.findById(id)) {
      return notFound;
    }
    const current = new Set((await repository.recipe(id)).map((row) => row.id_insumo));
    const found = await repository.findIngredients(ingredientes.map((item) => item.idInsumo));
    const usable = new Set(found.filter((row) => row.activo || current.has(row.id_insumo)).map((row) => row.id_insumo));
    if (ingredientes.some((item) => !usable.has(item.idInsumo))) {
      return invalidIngredient;
    }
    await transaction((tx) => tx.replaceRecipe(id, ingredientes));
    return getRecipe(id);
  };

  return {list, options, getById, getRecipe, recipeOptions, saveRecipe, create, update, setStatus, setAvailability, ...createImageActions({repository, images, getById, notFound})};
};
