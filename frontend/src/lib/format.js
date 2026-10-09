// Utilidades de formato compartidas por los componentes.

export const getInitials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

const dateFormatter = new Intl.DateTimeFormat('es-BO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const timeFormatter = new Intl.DateTimeFormat('es-BO', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

const titleCase = (text) =>
  text.replace(/\b(\p{L})(\p{L}{3,})/gu, (_, first, rest) => first.toUpperCase() + rest);

export const formatDateTime = (date) => ({
  date: titleCase(dateFormatter.format(date)),
  time: timeFormatter.format(date),
});
