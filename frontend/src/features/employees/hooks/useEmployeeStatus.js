import {employeesApi} from '../services/employeesApi';
import {useStatusToggle} from '../../../hooks/useStatusToggle';

const successMessage = ({employee}) => {
  const fullName = `${employee.nombre} ${employee.apellido}`;
  if (employee.activo) {
    return `Se reactivó a ${fullName}`;
  }
  return `Se dio de baja a ${fullName}`;
};

export function useEmployeeStatus({onChanged, api = employeesApi} = {}) {
  return useStatusToggle({
    request: (employee) => api.setStatus(employee.id, !employee.activo),
    successMessage,
    onChanged,
  });
}
