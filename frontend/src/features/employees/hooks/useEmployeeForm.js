import {employeesApi} from '../services/employeesApi';
import {EMPTY_FORM} from '../constants/employees';
import {toFormValues, toPayload, validateEmployee} from '../utils/validateEmployee';
import {useEntityForm} from '../../../hooks/useEntityForm';

const fullName = (employee) => `${employee.nombre} ${employee.apellido}`;

const MESSAGES = {
  created: (employee) => `Se registró a ${fullName(employee)}`,
  updated: (employee) => `Se actualizaron los datos de ${fullName(employee)}`,
  imageFailed: 'El empleado se guardó, pero la foto no',
};

export function useEmployeeForm({onSaved, api = employeesApi} = {}) {
  return useEntityForm({
    api,
    entityKey: 'employee',
    emptyValues: EMPTY_FORM,
    toFormValues,
    toPayload,
    validate: validateEmployee,
    messages: MESSAGES,
    onSaved,
  });
}
