import {useRef} from 'react';
import {sectionsApi} from '../services/sectionsApi';
import {DEFAULT_CAPACITY, EMPTY_FORM} from '../constants/sections';
import {nextTableName, tableErrorKey, toFormValues, toPayload, validateSection} from '../utils/sectionForm';
import {useEntityForm} from '../../../hooks/useEntityForm';

const MESSAGES = {
  created: (section) => `Se registró la sección ${section.nombre} con ${section.totalMesas} mesas`,
  updated: (section) => `Se actualizó la sección ${section.nombre}`,
};

export function useSectionForm({onSaved, api = sectionsApi} = {}) {
  const form = useEntityForm({
    api,
    entityKey: 'section',
    emptyValues: EMPTY_FORM,
    toFormValues,
    toPayload,
    validate: validateSection,
    messages: MESSAGES,
    onSaved,
  });
  const nextKey = useRef(0);
  const tables = form.values.mesas;
  // Los nombres repetidos dependen de las otras mesas: al cambiar una se limpian los avisos de todas
  const tableErrors = tables.map((table) => tableErrorKey(table.key));

  // Agrega una mesa con el nombre que sigue a la última y la capacidad de la anterior
  const addTable = () => {
    nextKey.current += 1;
    const capacidad = tables.at(-1)?.capacidad ?? DEFAULT_CAPACITY;
    form.setFields({mesas: [...tables, {key: `nueva-${nextKey.current}`, nombre: nextTableName(tables), capacidad}]});
  };

  const removeTable = (key) => {
    form.setFields({mesas: tables.filter((table) => table.key !== key)}, tableErrors);
  };

  const setTable = (key, field, value) => {
    form.setFields({
      mesas: tables.map((table) => {
        if (table.key === key) {
          return {...table, [field]: value};
        }
        return table;
      }),
    }, tableErrors);
  };

  return {...form, addTable, removeTable, setTable};
}
