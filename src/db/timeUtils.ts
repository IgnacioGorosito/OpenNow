/**
 * Dado los horarios de un lugar, determina si está abierto AHORA
 * usando la zona horaria de Argentina (America/Argentina/Buenos_Aires).
 */
export function isOpenNow(
  schedules: { day_of_week: number; open_time: string; close_time: string }[]
): boolean {
  const now = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' })
  );
  const currentDay  = now.getDay();
  const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

  return schedules.some(
    (s) =>
      s.day_of_week === currentDay &&
      currentTime >= s.open_time.slice(0, 5) &&
      currentTime <  s.close_time.slice(0, 5)
  );
}
