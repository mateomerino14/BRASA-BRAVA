import {sectionsApi} from '../services/sectionsApi';
import {useStatusToggle} from '../../../hooks/useStatusToggle';

const successMessage = ({section}) => {
  if (section.activa) {
    return `Se reactivó la sección ${section.nombre}`;
  }
  return `Se dio de baja la sección ${section.nombre}`;
};

export function useSectionStatus({onChanged, api = sectionsApi} = {}) {
  return useStatusToggle({
    request: (section) => api.setStatus(section.id, !section.activa),
    successMessage,
    onChanged,
  });
}
