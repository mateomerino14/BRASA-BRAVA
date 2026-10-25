import {localDayRange} from '../../utils/calendar.js';

export const CONFIRMATION_WORD = 'ELIMINAR';
const SAMPLE_SALES = 20;

// Tabla, columna de id, columna de activo y foto de cada tipo que se elige en la pantalla
const KINDS = {
  empleados: {table: 'empleado', id: 'id_empleado', active: 'activo', label: "nombre || ' ' || apellido", image: 'foto_url', singular: 'al empleado'},
  cargos: {table: 'cargo', id: 'id_cargo', active: 'activo', singular: 'el cargo'},
  secciones: {table: 'seccion', id: 'id_seccion', active: 'activa', singular: 'la sección'},
  productos: {table: 'producto', id: 'id_producto', active: 'activo', image: 'imagen_url', singular: 'el producto'},
  categorias: {table: 'categoria', id: 'id_categoria', active: 'activa', image: 'imagen_url', singular: 'la categoría'},
  insumos: {table: 'insumo', id: 'id_insumo', active: 'activo', singular: 'el insumo'},
  promociones: {table: 'promocion', id: 'id_promocion', active: 'activa', image: 'imagen_url', singular: 'la promoción'},
};

const unique = (...lists) => [...new Set(lists.flat())];
const without = (list, removed) => list.filter((id) => !removed.includes(id));

// Reglas de la eliminación física: qué se puede borrar, qué arrastra y el borrado en una transacción
export const createDeletionService = ({repository, transaction, images, timeZone}) => {
  // Lo que se puede elegir en cada pestaña (las ventas, por rango de fechas)
  const candidates = async (tipo, {desde, hasta}) => {
    const loaders = {
      empleados: repository.inactiveEmployees,
      cargos: repository.inactiveRoles,
      secciones: repository.inactiveSections,
      productos: repository.inactiveProducts,
      categorias: repository.inactiveCategories,
      insumos: repository.inactiveIngredients,
      promociones: repository.inactivePromotions,
    };
    if (tipo !== 'ventas') {
      return {registros: await loaders[tipo]()};
    }
    const rows = await repository.closedSales(localDayRange(desde, timeZone).start, localDayRange(hasta, timeZone).end);
    return {registros: rows.map((row) => ({id: row.id, cerradaEn: row.cerrada_en, total: Number(row.total), mesa: row.mesa, seccion: row.seccion, cobrador: row.cobrador}))};
  };

  // Todo lo que se borra al eliminar lo elegido (en cascada) y lo que impide hacerlo
  const plan = async (repo, seleccion) => {
    const bloqueos = [];
    for (const [tipo, kind] of Object.entries(KINDS)) {
      for (const row of await repo.activeOf(kind.table, kind.id, kind.active, seleccion[tipo], kind.label)) {
        bloqueos.push(`${row.nombre} sigue activo: dé de baja ${kind.singular} antes de eliminar`);
      }
    }
    const roleEmployees = await repo.employeesOfRoles(seleccion.cargos);
    for (const employee of roleEmployees.filter((row) => row.activo)) {
      bloqueos.push(`${employee.nombre} sigue activo en un cargo elegido: dé de baja al empleado o cámbielo de cargo`);
    }
    const empleados = unique(seleccion.empleados, roleEmployees.map((row) => row.id));
    const subcategorias = await repo.subcategoriesOf(seleccion.categorias);
    const productos = unique(seleccion.productos, await repo.productsOfSubcategories(subcategorias));
    const promociones = unique(seleccion.promociones, await repo.promotionsWithProducts(productos));
    const mesas = await repo.tablesOf(seleccion.secciones);
    const ventas = unique(
      seleccion.ventas,
      await repo.salesOfEmployees(empleados),
      await repo.salesOfTables(mesas.map((row) => row.id)),
      await repo.salesWithProducts(productos),
      await repo.salesWithPromotions(promociones),
      await repo.salesWithIngredients(seleccion.insumos),
    );
    const salesInfo = await repo.salesInfo(ventas);
    const open = salesInfo.filter((row) => row.estado !== 'cobrada');
    if (open.length > 0) {
      bloqueos.push(`Hay ${open.length} pedidos abiertos que dependen de lo elegido (${open.map((row) => row.mesa).join(', ')}): cóbrelos antes`);
    }
    return {seleccion, empleados, subcategorias, productos, promociones, mesas, ventas, salesInfo, bloqueos};
  };

  // Resumen para la confirmación: lo elegido y lo que arrastra
  const describe = async (result) => {
    const {seleccion} = result;
    const names = async (tipo, ids) => (await repository.namesOf(KINDS[tipo].table, KINDS[tipo].id, ids, KINDS[tipo].label)).map((row) => row.nombre);
    const elegidos = {};
    for (const tipo of Object.keys(KINDS)) {
      elegidos[tipo] = await names(tipo, seleccion[tipo]);
    }
    elegidos.ventas = seleccion.ventas.length;
    return {
      elegidos,
      arrastra: {
        empleados: await names('empleados', without(result.empleados, seleccion.empleados)),
        mesas: result.mesas.map((row) => row.nombre),
        productos: await names('productos', without(result.productos, seleccion.productos)),
        promociones: await names('promociones', without(result.promociones, seleccion.promociones)),
        ventas: {
          total: without(result.ventas, seleccion.ventas).length,
          ejemplos: result.salesInfo.filter((row) => !seleccion.ventas.includes(row.id)).slice(0, SAMPLE_SALES)
            .map((row) => ({id: row.id, mesa: row.mesa, total: Number(row.total), cerradaEn: row.cerrada_en})),
        },
      },
      bloqueos: result.bloqueos,
    };
  };

  // Vista previa de lo que se borraría
  const preview = async (seleccion) => describe(await plan(repository, seleccion));

  // Borra para siempre lo elegido y todo lo que depende de ello, en una sola transacción
  const execute = async ({confirmacion, ...seleccion}) => {
    if (confirmacion !== CONFIRMATION_WORD) {
      return {error: `Escriba ${CONFIRMATION_WORD} para confirmar`, status: 400, detail: {campo: 'confirmacion'}};
    }
    const result = await transaction(async (tx) => {
      const steps = await plan(tx, seleccion);
      if (steps.bloqueos.length > 0) {
        return {problem: {error: steps.bloqueos[0], status: 409, detail: {bloqueos: steps.bloqueos}}};
      }
      const urls = [
        ...await tx.imagesOf('empleado', 'id_empleado', 'foto_url', steps.empleados),
        ...await tx.imagesOf('producto', 'id_producto', 'imagen_url', steps.productos),
        ...await tx.imagesOf('categoria', 'id_categoria', 'imagen_url', seleccion.categorias),
        ...await tx.imagesOf('promocion', 'id_promocion', 'imagen_url', steps.promociones),
      ].map((row) => row.url);
      await tx.deleteWhere('venta', 'id_venta', steps.ventas);
      await tx.deleteWhere('promocion', 'id_promocion', steps.promociones);
      await tx.deleteWhere('receta', 'id_insumo', seleccion.insumos);
      await tx.deleteWhere('movimiento_stock', 'id_insumo', seleccion.insumos);
      await tx.deleteWhere('insumo', 'id_insumo', seleccion.insumos);
      await tx.deleteWhere('producto', 'id_producto', steps.productos);
      await tx.deleteWhere('subcategoria', 'id_subcategoria', steps.subcategorias);
      await tx.deleteWhere('categoria', 'id_categoria', seleccion.categorias);
      await tx.deleteWhere('mesa', 'id_mesa', steps.mesas.map((row) => row.id));
      await tx.deleteWhere('seccion', 'id_seccion', seleccion.secciones);
      await tx.deleteWhere('empleado', 'id_empleado', steps.empleados);
      await tx.deleteWhere('cargo', 'id_cargo', seleccion.cargos);
      return {
        urls,
        borrados: {
          empleados: steps.empleados.length,
          cargos: seleccion.cargos.length,
          secciones: seleccion.secciones.length,
          mesas: steps.mesas.length,
          productos: steps.productos.length,
          categorias: seleccion.categorias.length,
          insumos: seleccion.insumos.length,
          promociones: steps.promociones.length,
          ventas: steps.ventas.length,
        },
      };
    });
    if (result.problem) {
      return result.problem;
    }
    for (const url of result.urls) {
      await images.remove(url);
    }
    return {borrados: result.borrados};
  };

  return {candidates, preview, execute};
};
