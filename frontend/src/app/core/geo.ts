export interface Coords {
  lat: number;
  lng: number;
}

// Distancia en km entre dos puntos (fórmula de Haversine)
export function distanceKm(a: Coords, b: Coords): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export function formatKm(d: number): string {
  if (d < 1) return `${Math.round(d * 1000)} m`;
  return `${d.toFixed(1).replace('.', ',')} km`;
}

// La API devuelve latitud y longitud como texto (NUMERIC de Postgres)
export function coordsOf(p: {
  latitude: string | number | null;
  longitude: string | number | null;
}): Coords | null {
  if (p.latitude === null || p.longitude === null) return null;
  const lat = Number(p.latitude);
  const lng = Number(p.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}