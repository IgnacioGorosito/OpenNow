import { describe, it, expect, afterEach, vi } from 'vitest';
import { isOpenNow } from '../src/db/timeUtils';

// Argentina es UTC-3 todo el año. Fechas de referencia:
// 2026-10-18 = domingo, 2026-10-19 = lunes, 2026-10-20 = martes
function ahoraEs(fecha: string, hora: string): void {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(`${fecha}T${hora}:00-03:00`));
}

afterEach(() => {
  vi.useRealTimers();
});

const lunesManiana = [{ day_of_week: 1, open_time: '08:00:00', close_time: '13:00:00' }];

describe('isOpenNow', () => {
  it('está abierto dentro del horario', () => {
    ahoraEs('2026-10-19', '12:00');
    expect(isOpenNow(lunesManiana)).toBe(true);
  });

  it('está cerrado antes de abrir', () => {
    ahoraEs('2026-10-19', '07:59');
    expect(isOpenNow(lunesManiana)).toBe(false);
  });

  it('abre justo a la hora de apertura', () => {
    ahoraEs('2026-10-19', '08:00');
    expect(isOpenNow(lunesManiana)).toBe(true);
  });

  it('cierra justo a la hora de cierre', () => {
    ahoraEs('2026-10-19', '13:00');
    expect(isOpenNow(lunesManiana)).toBe(false);
  });

  it('está cerrado en un día sin horario', () => {
    ahoraEs('2026-10-20', '10:00');
    expect(isOpenNow(lunesManiana)).toBe(false);
  });

  it('está cerrado si no tiene horarios cargados', () => {
    ahoraEs('2026-10-19', '10:00');
    expect(isOpenNow([])).toBe(false);
  });

  it('soporta varios rangos en el mismo día', () => {
    const partido = [
      { day_of_week: 1, open_time: '08:00:00', close_time: '13:00:00' },
      { day_of_week: 1, open_time: '16:00:00', close_time: '20:00:00' },
    ];
    ahoraEs('2026-10-19', '14:00');
    expect(isOpenNow(partido)).toBe(false);
    ahoraEs('2026-10-19', '17:00');
    expect(isOpenNow(partido)).toBe(true);
  });

  it('usa la hora de Argentina y no la de UTC', () => {
    // Domingo 23:00 en Argentina = lunes 02:00 UTC
    ahoraEs('2026-10-18', '23:00');
    const domingoNoche = [{ day_of_week: 0, open_time: '22:00:00', close_time: '23:59:00' }];
    const lunesUtc = [{ day_of_week: 1, open_time: '00:00:00', close_time: '05:00:00' }];
    expect(isOpenNow(domingoNoche)).toBe(true);
    expect(isOpenNow(lunesUtc)).toBe(false);
  });
});