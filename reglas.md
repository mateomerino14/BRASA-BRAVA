# Estándares de desarrollo

Brasa Brava — convenciones de ramas, commits y codificación.

---

## ESTÁNDARES DE RAMAS

| Rama | Uso |
|---|---|
| `main` | Versión estable entregada al cliente |
| `develop` | Integración de los módulos terminados |
| `feature/<modulo>` | Desarrollo de un módulo o funcionalidad, en `snake_case` (ej. `feature/gestion_productos`) |
| `fix/<tema>` | Corrección puntual sobre `develop` |

### Flujo

1. Cada módulo se desarrolla en su rama `feature/<modulo>`, creada desde `develop`.
2. Al terminarlo se abre un Pull Request hacia `develop`. Las pruebas automáticas de GitHub Actions deben pasar antes del merge.
3. Cuando `develop` reúne una entrega completa, se abre un Pull Request de `develop` hacia `main`.

---

## ESTÁNDARES DE COMMITS

Se utiliza la convención Conventional Commits para mantener un historial claro y organizado.

### Tipos de commit

| Tipo | Uso |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de errores |
| `style` | Cambios visuales o de estilos sin afectar la lógica |
| `refactor` | Reestructuración de código sin modificar el comportamiento |
| `docs` | Documentación |
| `test` | Creación o actualización de pruebas |
| `chore` | Configuración, dependencias y scripts de base de datos |

### Formato

```
<tipo>: <Descripción>
```

### Ejemplos válidos

```
feat: Implementa el inicio de sesión de empleados y del DIRECTORIO
feat: Implementa la recuperación de contraseña con código de verificación
fix: Evita que el modal pierda el foco al escribir
style: Unifica los colores del menú lateral con la paleta
refactor: Separa los pasos de recuperación en constantes
test: Agrega pruebas de la API de autenticación
chore: Ejecuta las pruebas automáticamente en GitHub Actions
```

### Reglas

- Los mensajes deben comenzar con mayúscula después del prefijo.
- Describir la funcionalidad implementada, no los archivos modificados.
- Un commit debe representar una única funcionalidad, corrección o mejora.
- Mantener mensajes cortos, claros y descriptivos.
- Evitar mensajes genéricos: `cambios`, `correcciones`, `actualización`, `prueba`.

---

## ESTÁNDARES DE CODIFICACIÓN

### Idioma

- El código fuente se desarrolla en inglés: variables, funciones, componentes, hooks, servicios, constantes y rutas.
- Los textos visibles para el usuario permanecen en español.
- Los nombres de tablas y columnas de la base de datos permanecen en español, por corresponder al modelo de dominio original.

```javascript
// Correcto
const loginUsers = [];
const requestPasswordReset = () => {};

// Incorrecto
const usuariosLogin = [];
const solicitarRecuperacion = () => {};
```

### Comentarios

- **Frontend**: no se incluyen comentarios explicativos por función. El nombre de la función y su contenido deben ser suficientes.
- **Backend**: cada función lleva un comentario de una línea que describe su propósito. Dentro de las funciones solo se dejan avisos importantes, también de una línea.
- **Base de datos**: comentarios breves en los scripts SQL: un encabezado por sección y una línea donde haga falta.

```javascript
// Genera un código numérico aleatorio de 6 dígitos
export const generateCode = () => String(randomInt(0, codeRange)).padStart(codeLength, '0');
```

- Eliminar código comentado antes de realizar commits.

### Sintaxis

El formato se valida con ESLint (`npm run lint`) y se corrige solo con `npm run lint:fix`.

**Punto y coma** al final de cada sentencia.

**No usar operadores ternarios en la lógica de control**; se prefieren bloques `if`/`else` explícitos. El ternario se admite únicamente dentro de expresiones de estilo o valores simples en el JSX.

```javascript
// Correcto
if (username.toUpperCase() === directorioUsername) {
  return loginDirectorio(password);
}
return loginEmployee(username, password);

// Incorrecto
return username.toUpperCase() === directorioUsername ? loginDirectorio(password) : loginEmployee(username, password);
```

**`else` y `catch` en línea nueva**, posterior al cierre de la llave.

```javascript
try {
  await mailer.send(message);
}
catch (error) {
  logger.error(error.message);
}
```

**Literales de objeto sin espacios internos.**

```javascript
// Correcto
const payload = {message: 'Código verificado'};

// Incorrecto
const payload = { message: 'Código verificado' };
```

**Usar `const` por defecto**; `let` únicamente cuando el valor deba reasignarse.

**Evitar valores mágicos**; declararlos como constantes con nombre.

```javascript
const minPasswordLength = 8;
const msPerMinute = 60_000;
```

---

## FRONTEND

### Estructura

```
src/
├── components/       Sistema de diseño compartido (Atomic Design)
│   ├── atoms/
│   ├── molecules/
│   ├── organisms/
│   └── templates/
├── features/         Módulos funcionales
│   └── <modulo>/
│       ├── pages/        Páginas asociadas a rutas
│       ├── components/   Organismos propios del módulo
│       ├── hooks/        Estado, validación y llamadas a servicios
│       ├── services/     Capa de acceso a la API
│       └── constants/    Catálogos y textos del módulo
├── config/           Menú lateral y permisos por pantalla
├── context/          Sesión del usuario
├── router/           Rutas y guardas de sesión y permisos
├── lib/              Cliente HTTP y funciones auxiliares puras
└── styles/           Tokens de la paleta y tipografía
```

### Separación de responsabilidades

| Capa | Puede | No puede |
|---|---|---|
| Servicio | Llamar a la API, normalizar la respuesta | Mantener estado |
| Hook | Mantener estado, validar, llamar servicios | Renderizar JSX |
| Página | Invocar hooks, componer organismos | Llamar servicios directamente |
| Componente | Presentar datos recibidos por props | Conocer hooks de negocio |

Ningún componente de `components/` importa un servicio.

### Atomic Design

| Nivel | Definición |
|---|---|
| Átomo | Elemento indivisible, sin lógica de negocio |
| Molécula | Composición de átomos que resuelve una unidad funcional |
| Organismo | Bloque autónomo y complejo de la interfaz |
| Plantilla | Estructura de pantalla que ubica a los organismos |

Los átomos, moléculas, organismos y plantillas se documentan con una historia de Storybook (`<Nivel>.stories.jsx`) junto a sus archivos.

### Estilos

Cada componente declara un objeto `styles` al inicio del archivo, que agrupa las clases de Tailwind. Esto separa el maquetado del marcado, evita repetir cadenas extensas dentro del JSX y concentra los ajustes visuales en un solo lugar.

```javascript
const styles = {
  card: 'rounded-2xl border border-arena/50 bg-white p-5 shadow-card',
  title: 'font-display text-2xl text-carbon',
};

// Uso
<div className={styles.card}>
  <p className={styles.title}>Accesos rápidos</p>
</div>
```

Los valores de animación (posiciones, resortes) se declaran como constantes con nombre, igual que los estilos.

### Colores y tipografía

Ningún componente define colores literales. Todos se referencian desde los tokens de `src/styles/index.css`, tomados del prototipo de Figma.

```javascript
// Correcto
const styles = {logout: 'bg-rojo hover:bg-rojo-oscuro'};

// Incorrecto
const styles = {logout: 'bg-[#c1272d]'};
```

| Fuente | Clase | Uso |
|---|---|---|
| Bebas Neue | `font-display` | Títulos, marca y botones |
| Inter | `font-sans` | Interfaz, formularios y tablas |
| Playfair Display SC | `font-accent` | Solo el mensaje de bienvenida del Home |

### Animaciones

Las animaciones se hacen con Motion y deben respetar la opción "reducir movimiento" del sistema (`MotionConfig reducedMotion="user"`).

---

## BACKEND

### Estructura

```
src/
├── config/           Variables de entorno validadas
├── db/               Conexión, migraciones y datos de prueba
├── modules/          Un módulo por dominio
│   └── <modulo>/
│       ├── <modulo>.routes.js       Declaración de rutas, validaciones y límites
│       ├── <modulo>.controller.js   Lectura de la petición y respuesta
│       ├── <modulo>.service.js      Reglas de negocio
│       ├── <modulo>.repository.js   Consultas SQL
│       └── <modulo>.schemas.js      Validación de entradas con Zod
├── middlewares/      Autenticación, autorización, validación y errores
├── services/         Servicios transversales (correo)
└── utils/            Funciones auxiliares puras
```

Cada módulo agrupa sus cinco capas en una misma carpeta, de modo que cada funcionalidad se sigue verticalmente con una única nomenclatura.

### Contrato entre capas

Un controlador siempre recibe `(req, res)`. Un servicio recibe parámetros explícitos y devuelve un objeto plano.

```javascript
// Controlador
verifyReset: async (req, res) => {
  const result = await service.verifyResetCode(req.validated.body);
  if (result.error) {
    return res.status(result.status).json({message: result.error});
  }
  else {
    return res.json({message: 'Código verificado'});
  }
},

// Servicio
const verifyResetCode = async (input) => {
  const result = await checkCode(input);
  if (result.error) {
    return result;
  }
  return {verified: true};
};
```

Los servicios **no lanzan excepciones** para errores de negocio previstos: los devuelven como `{error, status}`.

### Consultas

Todas las consultas viven en el repositorio del módulo y usan parámetros (`$1`, `$2`). Nunca se concatenan valores en el SQL.

### Operaciones auxiliares

Las tareas que no deben interrumpir el flujo principal —como el envío de correos— se ejecutan dentro de un bloque de captura que registra la incidencia.

### Autorización

La restricción de acceso se declara en la ruta, no dentro del controlador.

```javascript
router.get('/me', authenticate(config.JWT_SECRET), controller.me);
```

### Validación

Las validaciones se aplican en el backend siempre (esquemas Zod), y se replican en el frontend cuando anticipar el error mejora la experiencia.

El backend es la única fuente de verdad: una validación presente solo en el cliente no protege la integridad de los datos.

---

## BASE DE DATOS

- Los nombres de tablas y columnas permanecen en español.
- Toda columna de fecha y hora usa `timestamptz`.
- Los cambios de esquema se agregan como un archivo nuevo en `backend/database/migrations/` con prefijo numérico (`002_productos.sql`). Nunca se edita una migración ya subida.
- Las migraciones se aplican solas al arrancar la API. Esto permite que la aplicación de escritorio se actualice en cada local sin correr scripts a mano.
- Los índices se declaran sobre las columnas usadas como criterio de filtrado o unión.

---

## PRUEBAS

- Cada módulo incluye pruebas de la API (Supertest) y de la interfaz (Testing Library).
- Un módulo se considera terminado cuando las pruebas pasan en GitHub Actions, su historia de Storybook está al día y su README está actualizado.

---

## BUENAS PRÁCTICAS GENERALES

- Cada archivo tiene una única responsabilidad principal.
- Evitar lógica compleja dentro de los componentes visuales.
- Centralizar la lógica reutilizable en hooks y servicios.
- Mantener nombres descriptivos y consistentes.
- Evitar código duplicado.
- No incluir credenciales en el repositorio; usar variables de entorno.
