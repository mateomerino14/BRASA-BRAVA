import {useState} from 'react';
import {employeesApi} from '../services/employeesApi';
import {EMPTY_FORM} from '../constants/employees';
import {toFormValues, toPayload, validateEmployee} from '../utils/validateEmployee';
import {suggestAlias} from '../utils/suggestAlias';
import {useEntityForm} from '../../../hooks/useEntityForm';

const fullName = (employee) => `${employee.nombre} ${employee.apellido}`;

const MESSAGES = {
  created: (employee) => `Se registró a ${fullName(employee)}`,
  updated: (employee) => `Se actualizaron los datos de ${fullName(employee)}`,
  imageFailed: 'El empleado se guardó, pero la foto no',
};

const NAME_FIELDS = ['nombre', 'apellido'];

export function useEmployeeForm({onSaved, api = employeesApi} = {}) {
  const form = useEntityForm({
    api,
    entityKey: 'employee',
    emptyValues: EMPTY_FORM,
    toFormValues,
    toPayload,
    validate: validateEmployee,
    messages: MESSAGES,
    onSaved,
    withImage: true,
    imageField: 'fotoUrl',
  });
  const [aliasEdited, setAliasEdited] = useState(false);

  const setField = (field, value) => {
    if (field === 'alias') {
      setAliasEdited(true);
      form.setField(field, value);
      return;
    }
    if (form.isEdit || aliasEdited || !NAME_FIELDS.includes(field)) {
      form.setField(field, value);
      return;
    }
    const next = {...form.values, [field]: value};
    form.setFields({[field]: value, alias: suggestAlias(next.nombre, next.apellido)});
  };

  return {
    ...form,
    setField,
    openCreate: () => {
      setAliasEdited(false);
      form.openCreate();
    },
  };
}
