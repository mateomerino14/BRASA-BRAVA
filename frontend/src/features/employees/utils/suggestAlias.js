const ALIAS_MAX_LENGTH = 30;

// Primera palabra en minúsculas, sin tildes ni signos
const firstWord = (text) => text
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .trim()
  .split(/\s+/)[0]
  .replace(/[^a-z0-9]/g, '');

// Sugiere el usuario a partir del nombre y apellido: "Carlos Andrés" + "Mendoza Rojas" → "c.mendoza"
export const suggestAlias = (nombre, apellido) => {
  const name = firstWord(nombre);
  const surname = firstWord(apellido);
  if (!surname) {
    return name.slice(0, ALIAS_MAX_LENGTH);
  }
  if (!name) {
    return surname.slice(0, ALIAS_MAX_LENGTH);
  }
  return `${name[0]}.${surname}`.slice(0, ALIAS_MAX_LENGTH);
};
