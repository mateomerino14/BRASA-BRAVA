-- El DIRECTORIO que se crea solo en una instalación nueva debe cambiar la contraseña inicial al entrar
ALTER TABLE directorio ADD COLUMN cambiar_contrasena BOOLEAN NOT NULL DEFAULT FALSE;
