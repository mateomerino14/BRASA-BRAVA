import {rolesApi} from '../services/rolesApi';
import {useStatusToggle} from '../../../hooks/useStatusToggle';

const successMessage = ({role}) => {
  if (role.activo) {
    return `Se reactivó el cargo ${role.nombre}`;
  }
  return `Se dio de baja el cargo ${role.nombre}`;
};

export function useRoleStatus({onChanged, api = rolesApi} = {}) {
  return useStatusToggle({
    request: (role) => api.setStatus(role.id, !role.activo),
    successMessage,
    onChanged,
  });
}
