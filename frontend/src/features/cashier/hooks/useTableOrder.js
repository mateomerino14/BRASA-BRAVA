import {useEffect, useMemo, useState} from 'react';
import {cashierApi} from '../services/cashierApi';
import {NOTICE_DURATION_MS} from '../../../config/lists';
import {normalizeText} from '../../../lib/format';
import {ALL_CATEGORIES, MAX_QUANTITY, PROMOTIONS_CATEGORY} from '../constants/cashier';
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

// Pedido de una mesa: lo ya registrado, el catálogo del día, los meseros y las líneas por registrar
export function useTableOrder({api = cashierApi, idMesa, user}) {
  const [state, setState] = useState(initialState);
  const [lines, setLines] = useState([]);
  const [idMesero, setIdMesero] = useState('');
  const [meseroError, setMeseroError] = useState('');
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [search, setSearch] = useState('');
  const [picker, setPicker] = useState({open: false, session: 0, kind: 'producto', item: null, line: null});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [table, catalog, waiters] = await Promise.all([api.table(idMesa), api.catalog(), api.waiters()]);
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

  useEffect(() => {
    if (!notice) {
      return undefined;
    }
    const timer = setTimeout(() => setNotice(''), NOTICE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [notice]);

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
    setSubmitError('');
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
    setSubmitError('');
    try {
      const result = await api.addOrder(idMesa, toOrderPayload(idMesero, lines));
      setState((current) => ({...current, venta: result.venta}));
      setLines([]);
      if (result.nueva) {
        setNotice(`Se abrió ${result.mesa.nombre} con el pedido Nº ${result.venta.numero}`);
      }
      else {
        setNotice(`Se sumó el envío ${result.venta.envios} al pedido Nº ${result.venta.numero}`);
      }
      return true;
    }
    catch (problem) {
      setSubmitError(problem.message);
      return false;
    }
    finally {
      setSaving(false);
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
    submitError,
    notice,
    submit,
  };
}
