export const RESET_STEPS = {
  email: {
    title: 'Recuperar contraseña',
    description: 'Ingrese el correo asociado a su cuenta de empleado.',
    action: 'Enviar código',
    icon: 'email',
  },
  code: {
    title: 'Verificación de identidad',
    description: 'Ingrese el código de verificación enviado a su correo.',
    action: 'Verificar',
    icon: 'confirm',
  },
  password: {
    title: 'Nueva contraseña',
    description: 'Cree una contraseña segura para su cuenta.',
    action: 'Guardar contraseña',
    icon: 'save',
  },
  done: {
    title: 'Contraseña actualizada',
    description: 'Ya puede iniciar sesión con su nueva contraseña.',
    action: 'Volver al inicio de sesión',
    icon: 'login',
  },
};

export const CODE_PROBLEMS = {
  bloqueado: {
    title: 'Código bloqueado',
    text: 'Se agotaron los intentos de este código. Pida uno nuevo con «Reenviar código» para continuar.',
  },
  vencido: {
    title: 'Código vencido',
    text: 'Este código ya no está vigente. Pida uno nuevo con «Reenviar código» para continuar.',
  },
  invalido: {
    title: 'Código anulado',
    text: 'Este código ya no sirve, quizá porque pidió otro después. Pida uno nuevo con «Reenviar código».',
  },
};
