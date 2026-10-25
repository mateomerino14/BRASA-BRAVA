import {useEffect, useMemo, useState} from 'react';
import {cashierApi} from '../services/cashierApi';
import {useToast} from '../../../context/useToast';
import {normalizeText} from '../../../lib/format';
import {ALL_CATEGORIES, MAX_QUANTITY, PROMOTIONS_CATEGORY, TABLE_REFRESH_MS} from '../constants/cashier';
import {addAmounts, addLine, cartTotal, cartUnits, removeLine, replaceLine, setLineQuantity, toOrderPayload} from '../utils/cart';

const emptyCatalog = {categorias: [], productos: [], promociones: []};
const initialState = {loading: true, error: '', mesa: null, venta: null, catalog: emptyCatalog, waiters: []};

const defaultWaiter = (venta, waiters, user) => {
  if (venta) {
    return String(venta.mesero.id);
  }
  if (user && !user.isDirectorio && waiters.some((item) => item.id === user.id)) {
    return String(user.id);
  }
  return '';
};

const matches = (item, search) => !search || normalizeText(item.nombre).includes(normalizeText(search));

// Grupos de ingredientes que se pueden quitar: uno por producto (en un combo, uno por cada producto del combo)
export const ingredientGroups = (kind, item) => {
  if (kind === 'promocion') {
    return item.productos.map((product) => ({idProducto: product.idProducto, nombre: product.nombre, cantidad: product.cantidad, ingredientes: product.ingredientes}));
  }
  return [{idProducto: item.id, nombre: item.nombre, cantidad: 1, ingredientes: item.ingredientes}];
};

// Pedido de una mesa: lo ya registrado, el catálogo del día, los meseros, las líneas por registrar y lo que sale de cocina.
// Sin mesa elegida solo carga el menú. "printKitchen" (app de escritorio con impresora de cocina) imprime la comanda
// directo; si no está o falla, se abre la vista previa. "onChanged" avisa que cambió la mesa (para refrescar la barra)
export function useTableOrder({api = cashierApi, idMesa, user, printKitchen, onChanged}) {
  const toast = useToast();
  const [state, setState] = useState(initialState);
  const [lines, setLines] = useState([]);
  const [idMesero, setIdMesero] = useState('');
  const [meseroError, setMeseroError] = useState('');
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [search, setSearch] = useState('');
  const [picker, setPicker] = useState({open: false, session: 0, kind: 'producto', item: null, line: null});
  const [saving, setSaving] = useState(false);
  const [readyOpen, setReadyOpen] = useState(false);
  const [marking, setMarking] = useState('');
  const [printing, setPrinting] = useState({open: false, envio: 0, printedAt: null});

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        let tableLoad = Promise.resolve({mesa: null, venta: null});
        if (idMesa) {
          tableLoad = api.table(idMesa);
        }
        const [table, catalog, waiters] = await Promise.all([tableLoad, api.catalog(), api.waiters()]);
        if (cancelled) {
          return;
        }
        setState({loading: false, error: '', mesa: table.mesa, venta: table.venta, catalog, waiters: waiters.meseros});
        setIdMesero(defaultWaiter(table.venta, waiters.meseros, user));
      }
      catch (problem) {
        if (!cancelled) {
          setState({...initialState, loading: false, error: problem.message});
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [api, idMesa, user]);

  // Refresca lo registrado de la mesa por si otra caja la cambió
  useEffect(() => {
    if (!state.mesa) {
      return undefined;
    }
    const timer = setInterval(async () => {
      try {
        const table = await api.table(idMesa);
        setState((current) => ({...current, venta: table.venta}));
      }
      catch {
        // Si falla, se intenta de nuevo en la próxima vuelta
      }
    }, TABLE_REFRESH_MS);
    return () => clearInterval(timer);
  }, [api, idMesa, state.mesa]);

  const {catalog} = state;
  const visibleItems = useMemo(() => {
    const promotions = catalog.promociones.filter((item) => matches(item, search)).map((item) => ({kind: 'promocion', item}));
    const products = catalog.productos.filter((item) => matches(item, search)).map((item) => ({kind: 'producto', item}));
    if (category === PROMOTIONS_CATEGORY) {
      return promotions;
    }
    if (category === ALL_CATEGORIES) {
      return [...promotions, ...products];
    }
    return products.filter(({item}) => String(item.idCategoria) === category);
  }, [catalog, category, search]);

  const openPicker = (kind, item, line = null) => {
    if (!state.mesa) {
      toast.error('Elija primero la mesa en la barra de arriba', 'Falta la mesa');
      return;
    }
    setPicker((current) => ({open: true, session: current.session + 1, kind, item, line}));
  };

  // Abre el detalle de una línea por registrar para cambiar cantidad, consumo o ingredientes
  const editLine = (line) => {
    let source = catalog.productos;
    if (line.tipo === 'promocion') {
      source = catalog.promociones;
    }
    const item = source.find((entry) => entry.id === line.id);
    if (item) {
      openPicker(line.tipo, item, line);
    }
  };

  const confirmPicker = ({cantidad, consumo, exclusiones}) => {
    const {kind, item, line} = picker;
    const next = {tipo: kind, id: item.id, nombre: item.nombre, precio: item.precio, cantidad, consumo, exclusiones};
    if (line) {
      setLines((current) => replaceLine(current, line.key, next, MAX_QUANTITY));
    }
    else {
      setLines((current) => addLine(current, next, MAX_QUANTITY));
    }
    setPicker((current) => ({...current, open: false}));
  };

  const changeWaiter = (value) => {
    setIdMesero(value);
    setMeseroError('');
  };

  const submit = async () => {
    if (!idMesero) {
      setMeseroError('Elija el mesero que atiende la mesa');
      return false;
    }
    if (lines.length === 0) {
      return false;
    }
    setSaving(true);
    try {
      const result = await api.addOrder(idMesa, toOrderPayload(idMesero, lines));
      setState((current) => ({...current, venta: result.venta}));
      setLines([]);
      if (result.sinStock?.length > 0) {
        toast.error(`No alcanzó el stock de ${result.sinStock.join(', ')}: quedó en 0 y el pedido se envió igual.`, 'Revise el inventario');
      }
      let message = `Se envió a cocina el envío ${result.envio} del pedido Nº ${result.venta.numero}`;
      if (result.nueva) {
        message = `Se abrió ${result.mesa.nombre} con el pedido Nº ${result.venta.numero} y se envió a cocina`;
      }
      const printedAt = new Date();
      const printed = await printKitchen?.({mesa: result.mesa, venta: result.venta, envio: result.envio, printedAt});
      if (printed?.ok) {
        message = `${message}. Comanda impresa en ${printed.impresora}`;
      }
      else {
        if (printed) {
          toast.error(`${printed.error}. Imprímala desde la vista previa.`, 'No se imprimió la comanda');
        }
        setPrinting({open: true, envio: result.envio, printedAt});
      }
      toast.success(message);
      onChanged?.();
      return true;
    }
    catch (problem) {
      toast.error(problem.message, 'No se pudo enviar a cocina');
      return false;
    }
    finally {
      setSaving(false);
    }
  };

  // Vuelve a leer la mesa después de marcar listos
  const refreshTable = async () => {
    const table = await api.table(idMesa);
    setState((current) => ({...current, venta: table.venta}));
    onChanged?.();
  };

  // Suma, resta o marca todas las unidades listas de una línea
  const markReady = async (line, accion) => {
    setMarking(`line-${line.id}`);
    try {
      await api.markLine(line.id, accion);
      await refreshTable();
    }
    catch (problem) {
      toast.error(problem.message, 'No se pudo marcar');
    }
    finally {
      setMarking('');
    }
  };

  // Marca listo todo lo que falta, envío por envío
  const markAllReady = async () => {
    const envios = [...new Set(state.venta.detalles.filter((line) => line.listos < line.cantidad).map((line) => line.envio))];
    setMarking('all');
    try {
      for (const envio of envios) {
        await api.markShipment(state.venta.id, envio, 'todos');
      }
      await refreshTable();
      toast.success(`Todo listo en ${state.mesa.nombre}. Ya se puede cobrar`);
    }
    catch (problem) {
      toast.error(problem.message, 'No se pudo marcar');
    }
    finally {
      setMarking('');
    }
  };

  const registered = state.venta?.total ?? 0;
  const pending = cartTotal(lines);

  return {
    ...state,
    lines,
    units: cartUnits(lines),
    totals: {registered, pending, total: addAmounts(registered, pending)},
    idMesero,
    meseroError,
    changeWaiter,
    category,
    changeCategory: setCategory,
    search,
    changeSearch: setSearch,
    visibleItems,
    picker,
    openPicker,
    closePicker: () => setPicker((current) => ({...current, open: false})),
    confirmPicker,
    editLine,
    changeQuantity: (key, cantidad) => setLines((current) => setLineQuantity(current, key, cantidad)),
    remove: (key) => setLines((current) => removeLine(current, key)),
    saving,
    printing,
    readyOpen,
    openReady: () => setReadyOpen(true),
    closeReady: () => setReadyOpen(false),
    marking,
    markReady,
    markAllReady,
    openPrint: (envio) => setPrinting({open: true, envio, printedAt: new Date()}),
    closePrint: () => setPrinting((current) => ({...current, open: false})),
    submit,
  };
}
