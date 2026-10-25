import {useCallback, useEffect, useState} from 'react';
import {useToast} from '../../../context/useToast';
import {saveFile} from '../../../lib/apiClient';
import {reportsApi} from '../services/reportsApi';
import {ALL_EMPLOYEES} from '../constants/reports';
import {isoDate} from '../utils/reports';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialFilters = () => {
  const today = isoDate(new Date());
  return {tipo: 'resumen', desde: today, hasta: today, empleado: ALL_EMPLOYEES};
};

// Reporte de ventas: filtros, resultado en pantalla, descarga del PDF y envío por correo
export function useReports({api = reportsApi} = {}) {
  const toast = useToast();
  const [filters, setFilters] = useState(initialFilters);
  const [employees, setEmployees] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [correo, setCorreo] = useState('');
  const [correoError, setCorreoError] = useState('');
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sale, setSale] = useState(null);

  // Genera con los filtros indicados; el reporte en pantalla queda con esos filtros
  const generate = useCallback(async (current) => {
    if (current.desde > current.hasta) {
      setErrors({hasta: 'La fecha "hasta" no puede ser anterior a "desde"'});
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const result = await api.report(current);
      setReport({...result.reporte, filters: current});
    }
    catch (problem) {
      toast.error(problem.message, 'No se pudo generar el reporte');
    }
    finally {
      setLoading(false);
    }
  }, [api, toast]);

  // Al abrir: empleados para el filtro y el reporte de hoy
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const first = initialFilters();
      const [people, result] = await Promise.allSettled([api.employees(), api.report(first)]);
      if (cancelled) {
        return;
      }
      if (people.status === 'fulfilled') {
        setEmployees(people.value.empleados);
      }
      if (result.status === 'fulfilled') {
        setReport({...result.value.reporte, filters: first});
      }
      else {
        toast.error(result.reason.message, 'No se pudo generar el reporte');
      }
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [api, toast]);

  const change = (changes) => {
    setFilters((current) => ({...current, ...changes}));
    setErrors({});
  };

  // Al cambiar el tipo se ve enseguida el otro formato del mismo período
  const changeType = (tipo) => {
    const next = {...filters, tipo};
    setFilters(next);
    generate(next);
  };

  const download = async () => {
    setDownloading(true);
    try {
      saveFile(await api.pdf(report.filters));
    }
    catch (problem) {
      toast.error(problem.message, 'No se pudo descargar el PDF');
    }
    finally {
      setDownloading(false);
    }
  };

  const email = async () => {
    const address = correo.trim();
    if (!EMAIL_PATTERN.test(address)) {
      setCorreoError('Ingrese un correo válido');
      return;
    }
    setSending(true);
    try {
      await api.email(report.filters, address);
      toast.success(`Se envió el reporte a ${address.toLowerCase()}`);
    }
    catch (problem) {
      toast.error(problem.message, 'No se pudo enviar el correo');
    }
    finally {
      setSending(false);
    }
  };

  return {
    filters,
    change,
    changeType,
    applyPeriod: (period) => change({desde: period.desde, hasta: period.hasta}),
    errors,
    employees,
    report,
    loading,
    generate: () => generate(filters),
    download,
    downloading,
    correo,
    changeCorreo: (value) => {
      setCorreo(value);
      setCorreoError('');
    },
    correoError,
    email,
    sending,
    sale,
    openSale: setSale,
    closeSale: () => setSale(null),
  };
}
