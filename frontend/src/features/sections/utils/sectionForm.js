import {DEFAULT_TABLE_PREFIX, MAX_CAPACITY, MIN_CAPACITY, NAME_MAX_LENGTH} from '../constants/sections';

const MIN_NAME_LENGTH = 2;
const TRAILING_NUMBER = /^(.*?)(\d+)$/;

export const tableErrorKey = (key) => `mesa:${key}`;

export const validateSection = (values) => {
  const errors = {};
  const nombre = values.nombre.trim();
  if (nombre.length < MIN_NAME_LENGTH) {
    errors.nombre = 'Ingrese el nombre de la sección (mínimo 2 letras)';
  }
  else if (nombre.length > NAME_MAX_LENGTH) {
    errors.nombre = 'El nombre es demasiado largo';
  }
  if (values.mesas.length === 0) {
    errors.mesas = 'Agregue al menos una mesa';
  }
  const seen = new Set();
  for (const table of values.mesas) {
    const name = table.nombre.trim().toLowerCase();
    if (!name) {
      errors[tableErrorKey(table.key)] = 'Ingrese el nombre de la mesa';
    }
    else if (seen.has(name)) {
      errors[tableErrorKey(table.key)] = 'Ya hay una mesa con ese nombre';
    }
    else if (table.capacidad < MIN_CAPACITY || table.capacidad > MAX_CAPACITY) {
      errors[tableErrorKey(table.key)] = `La capacidad debe ser de ${MIN_CAPACITY} a ${MAX_CAPACITY} personas`;
    }
    seen.add(name);
  }
  return errors;
};

export const nextTableName = (tables) => {
  const last = tables.at(-1)?.nombre.trim() ?? '';
  const match = TRAILING_NUMBER.exec(last);
  let prefix = `${DEFAULT_TABLE_PREFIX} `;
  if (match) {
    prefix = match[1];
  }
  const used = new Set(tables.map((table) => table.nombre.trim().toLowerCase()));
  let number = 1;
  if (match) {
    number = Number(match[2]) + 1;
  }
  while (used.has(`${prefix}${number}`.toLowerCase())) {
    number += 1;
  }
  return `${prefix}${number}`;
};

export const toFormValues = (section) => ({
  nombre: section.nombre,
  descripcion: section.descripcion ?? '',
  mesas: section.mesas.map((table) => ({key: `mesa-${table.id}`, id: table.id, nombre: table.nombre, capacidad: table.capacidad})),
});

export const toPayload = (values) => ({
  nombre: values.nombre.trim(),
  descripcion: values.descripcion.trim(),
  mesas: values.mesas.map(({id, nombre, capacidad}) => ({id, nombre: nombre.trim(), capacidad})),
});

export const capacityGroups = (tables) => {
  const counts = new Map();
  for (const table of tables) {
    counts.set(table.capacidad, (counts.get(table.capacidad) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([capacidad, mesas]) => ({capacidad, mesas}))
    .sort((a, b) => b.mesas - a.mesas || b.capacidad - a.capacidad);
};
