import {Avatar} from './Avatar';
import {Badge} from './Badge';
import {Logo} from './Logo';
import {Spinner} from './Spinner';
import {SocialIcon} from './SocialIcon';

export default {title: 'Átomos/Visuales'};

export const Logotipo = {render: () => <Logo size={160} glow />};
export const Avatares = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar name="Andrea Romero" size={56} />
      <Avatar name="Marco Vargas" size={40} />
      <Avatar name="Carlos Mendoza" size={28} />
    </div>
  ),
};
export const Insignias = {
  render: () => (
    <div className="flex gap-2">
      <Badge tone="success" dot>
        Activo
      </Badge>
      <Badge tone="danger" dot>
        Inactivo
      </Badge>
      <Badge tone="warning">Stock bajo</Badge>
      <Badge tone="brand">Nuevo</Badge>
      <Badge>Hamburguesas / Clásicas</Badge>
    </div>
  ),
};
export const Indicadores = {
  render: () => (
    <div className="flex items-center gap-4 text-brasa">
      <Spinner size={28} />
      <SocialIcon name="facebook" />
      <SocialIcon name="instagram" />
      <SocialIcon name="tiktok" />
    </div>
  ),
};
