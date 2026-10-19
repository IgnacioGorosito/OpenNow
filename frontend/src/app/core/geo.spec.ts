import { coordsOf, distanceKm, formatKm } from './geo';

describe('geo', () => {
  it('la distancia de un punto a sí mismo es cero', () => {
    const p = { lat: -33.7456, lng: -61.9688 };
    expect(distanceKm(p, p)).toBeCloseTo(0, 5);
  });

  it('calcula la distancia entre Venado Tuerto y Rosario (~151 km)', () => {
    const venado = { lat: -33.7456, lng: -61.9688 };
    const rosario = { lat: -32.9442, lng: -60.6505 };
    const d = distanceKm(venado, rosario);
    expect(d).toBeGreaterThan(145);
    expect(d).toBeLessThan(158);
  });

  it('formatea metros y kilómetros', () => {
    expect(formatKm(0.45)).toBe('450 m');
    expect(formatKm(2.5)).toBe('2,5 km');
  });

  it('convierte las coordenadas de texto a números', () => {
    expect(coordsOf({ latitude: '-33.7456000', longitude: '-61.9688000' })).toEqual({
      lat: -33.7456,
      lng: -61.9688
    });
  });

  it('devuelve null si el lugar no tiene ubicación', () => {
    expect(coordsOf({ latitude: null, longitude: null })).toBeNull();
  });
});