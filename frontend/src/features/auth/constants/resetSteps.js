export const RESET_STEPS = {
  email: {
    title: 'Recuperar contraseña',
    description: 'Ingrese el correo asociado a su cuenta de empleado.',
    action: 'Enviar código',
  },
  code: {
    title: 'Verificación de identidad',
    description: 'Ingrese el código de verificación enviado a su correo.',
    action: 'Verificar',
  },
  password: {
    title: 'Nueva contraseña',
    description: 'Cree una contraseña segura para su cuenta.',
    action: 'Guardar contraseña',
  },
  done: {
    title: 'Contraseña actualizada',
    description: 'Ya puede iniciar sesión con su nueva contraseña.',
    action: 'Volver al inicio de sesión',
  },
};
