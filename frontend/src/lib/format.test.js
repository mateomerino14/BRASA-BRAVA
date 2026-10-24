import {describe, expect, it} from 'vitest';
import {formatClock, formatDateTime, formatHours, formatPrice, formatTime, getInitials, rangeText} from './format';

describe('format', () => {
  it('obtiene hasta dos iniciales', () => {
    expect(getInitials('Marco Antonio Vargas')).toBe('MA');
    expect(getInitials('admin')).toBe('A');
    expect(getInitials('')).toBe('');
  });

  it('formatea fecha en español con mayúsculas y hora de 12h con AM/PM', () => {
    const {date, time, clock, period} = formatDateTime(new Date(2026, 9, 9, 13, 5, 7));
    expect(date).toMatch(/^Viernes, 9 de Octubre de 2026$/);
    expect(time).toBe('1:05:07 PM');
    expect([clock, period]).toEqual(['1:05', 'PM']);
  });

  it('muestra todas las horas igual: 12h con AM/PM', () => {
    expect(formatTime(new Date(2026, 9, 9, 0, 5))).toBe('12:05 AM');
    expect(formatTime(new Date(2026, 9, 9, 12, 0))).toBe('12:00 PM');
    expect(formatClock('18:30')).toBe('6:30 PM');
    expect(formatClock('')).toBe('');
    expect(formatHours('18:00', '21:00')).toBe('6:00 PM a 9:00 PM');
  });
});

describe('rangeText', () => {
  it('describe el rango visible o la falta de resultados', () => {
    expect(rangeText({page: 2, pageSize: 5, count: 3, total: 8, itemLabel: 'productos'})).toBe('Mostrando 6–8 de 8 productos');
    expect(rangeText({page: 1, pageSize: 5, count: 0, total: 0, itemLabel: 'productos'})).toBe('Sin resultados');
  });
});

describe('formatPrice', () => {
  it('usa Bs, coma decimal y punto de miles', () => {
    expect(formatPrice(1234.5)).toBe('Bs 1.234,50');
    expect(formatPrice(10)).toBe('Bs 10,00');
  });
});
