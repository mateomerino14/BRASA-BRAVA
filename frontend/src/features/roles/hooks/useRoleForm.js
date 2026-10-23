import {rolesApi} from '../services/rolesApi';
import {EMPTY_FORM} from '../constants/roles';
import {toFormValues, toPayload, validateRole} from '../utils/roleForm';
import {useEntityForm} from '../../../hooks/useEntityForm';

const MESSAGES = {
  created: (role) => `Se registró el cargo ${role.nombre}`,
  updated: (role) => `Se actualizó el cargo ${role.nombre}`,
};

export function useRoleForm({onSaved, api = rolesApi} = {}) {
  const form = useEntityForm({
    api,
    entityKey: 'role',
    emptyValues: EMPTY_FORM,
    toFormValues,
    toPayload,
    validate: validateRole,
    messages: MESSAGES,
    onSaved,
  });
  const selected = form.values.pantallas;

  const toggleScreen = (id) => {
    if (selected.includes(id)) {
      form.setField('pantallas', selected.filter((screen) => screen !== id));
      return;
    }
    form.setField('pantallas', [...selected, id]);
  };

  // Marca o desmarca todas las pantallas de un grupo
  const toggleGroup = (ids) => {
    const allChecked = ids.every((id) => selected.includes(id));
    if (allChecked) {
      form.setField('pantallas', selected.filter((screen) => !ids.includes(screen)));
      return;
    }
    form.setField('pantallas', [...selected, ...ids.filter((id) => !selected.includes(id))]);
  };

  return {...form, toggleScreen, toggleGroup};
}
