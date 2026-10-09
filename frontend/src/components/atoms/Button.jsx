import {motion} from 'motion/react';
import {cn} from '../../lib/cn';
import {Spinner} from './Spinner';

const styles = {
  base: 'inline-flex select-none items-center justify-center gap-2 rounded-lg font-display tracking-wide transition-[background-color,box-shadow,color,border-color] duration-200 disabled:cursor-not-allowed disabled:opacity-60',
  fullWidth: 'w-full',
  variants: {
    primary: 'bg-brasa text-white hover:bg-brasa-oscuro hover:shadow-brasa',
    dark: 'bg-carbon text-white hover:bg-black hover:shadow-float',
    danger: 'bg-rojo text-white hover:bg-rojo-oscuro',
    outline: 'bg-white text-carbon border border-arena hover:border-brasa hover:text-brasa',
    ghost: 'bg-transparent text-cafe hover:bg-crema',
  },
  sizes: {
    sm: 'h-9 px-4 text-lg',
    md: 'h-11 px-6 text-xl',
    lg: 'h-14 px-8 text-2xl',
  },
};

const hoverLift = {y: -2};
const tapPress = {scale: 0.96};
const springTransition = {type: 'spring', stiffness: 400, damping: 22};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  icon,
  className,
  children,
  type = 'button',
  ...props
}) {
  const isDisabled = disabled || loading;
  let leading = icon;
  if (loading) {
    leading = <Spinner size={18} label="Procesando" />;
  }

  return (
    <motion.button
      type={type}
      whileHover={isDisabled ? undefined : hoverLift}
      whileTap={isDisabled ? undefined : tapPress}
      transition={springTransition}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(styles.base, styles.variants[variant], styles.sizes[size], fullWidth && styles.fullWidth, className)}
      {...props}
    >
      {leading}
      {children}
    </motion.button>
  );
}
