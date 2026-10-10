import {describe, expect, it} from 'vitest';
import {formatDateTime, getInitials, rangeText} from './format';

describe('format', () => {
  it('obtiene hasta dos iniciales', () => {
    expect(getInitials('Marco Antonio Vargas')).toBe('MA');
    expect(getInitials('admin')).toBe('A');
    expect(getInitials('')).toBe('');
  });

  it('formatea fecha en español con mayúsculas y hora de 24h', () => {
    const {date, time} = formatDateTime(new Date(2026, 9, 9, 13, 5, 7));
    expect(date).toMatch(/^Viernes, 9 de Octubre de 2026$/);
    expect(time).toBe('13:05:07');
  });
});

describe('rangeText', () => {
  it('describe el rango visible o la falta de resultados', () => {
    expect(rangeText({page: 2, pageSize: 5, count: 3, total: 8, itemLabel: 'productos'})).toBe('Mostrando 6–8 de 8 productos');
    expect(rangeText({page: 1, pageSize: 5, count: 0, total: 0, itemLabel: 'productos'})).toBe('Sin resultados');
  });
});
