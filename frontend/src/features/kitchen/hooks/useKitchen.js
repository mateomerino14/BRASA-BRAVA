import {useEffect, useState} from 'react';
import {useSearchParams} from 'react-router';
import {kitchenApi} from '../services/kitchenApi';
import {KITCHEN_REFRESH_MS, PENDING_TAB, READY_TAB} from '../constants/kitchen';

const emptyData = {envios: [], summary: {preparacion: 0, listos: 0, unidadesPendientes: 0}};

// Pedidos de cocina: se recargan solos para ver los envíos nuevos de Caja; la pestaña elegida vive en la URL
export function useKitchen({api = kitchenApi} = {}) {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [now, setNow] = useState(() => Date.now());
  let tab = PENDING_TAB;
  if (params.get('estado') === READY_TAB) {
    tab = READY_TAB;
  }

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const result = await api.orders();
        if (!cancelled) {
          setData(result);
          setError('');
        }
      }
      catch (problem) {
        if (!cancelled) {
          setError(problem.message);
        }
      }
      finally {
        if (!cancelled) {
          setLoading(false);
          setNow(Date.now());
        }
      }
    };
    load();
    const timer = setInterval(load, KITCHEN_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [api]);

  // Ejecuta una acción de cocina y muestra el resultado; "key" evita tocar dos veces el mismo control mientras responde
  const run = async (key, action) => {
    setBusy(key);
    try {
      setData(await action());
      setError('');
      setNow(Date.now());
    }
    catch (problem) {
      setError(problem.message);
    }
    finally {
      setBusy('');
    }
  };

  const changeTab = (value) => {
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (value === READY_TAB) {
        next.set('estado', READY_TAB);
      }
      else {
        next.delete('estado');
      }
      return next;
    }, {replace: true});
  };

  let shipments = data.envios.filter((item) => item.estado === 'preparacion');
  if (tab === READY_TAB) {
    shipments = data.envios.filter((item) => item.estado === 'listo');
  }

  return {
    shipments,
    summary: data.summary,
    tab,
    changeTab,
    loading,
    error,
    busy,
    now,
    markLine: (line, accion) => run(`line-${line.id}`, () => api.markLine(line.id, accion)),
    markShipment: (shipment, accion) => run(`shipment-${shipment.id}`, () => api.markShipment(shipment.idVenta, shipment.envio, accion)),
  };
}
