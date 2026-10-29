import {motion} from 'motion/react';
import {Menu, X} from 'lucide-react';
import {Logo} from '../atoms/Logo';

const styles = {
  bar: 'flex h-16 shrink-0 items-center gap-3 bg-brasa px-4 text-white shadow-card',
  title: 'min-w-0 flex-1 truncate pt-1 font-display text-[26px] leading-tight',
  toggle: 'flex size-11 shrink-0 items-center justify-center rounded-xl bg-carbon text-crema transition-colors hover:bg-black focus-visible:outline-white',
};

const tapPress = {scale: 0.92};

export function MobileTopBar({title, open = false, expanded = open, onToggle, titleAs: Title = 'h1'}) {
  let label = 'Abrir menú';
  let Icon = Menu;
  if (open) {
    label = 'Cerrar menú';
    Icon = X;
  }
  return (
    <div className={styles.bar}>
      <Logo size={38} />
      <Title className={styles.title}>{title}</Title>
      <motion.button type="button" onClick={onToggle} aria-label={label} aria-expanded={expanded} whileTap={tapPress} className={styles.toggle}>
        <Icon size={22} aria-hidden />
      </motion.button>
    </div>
  );
}
