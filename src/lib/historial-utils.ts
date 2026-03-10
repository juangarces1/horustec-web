export const FUEL_NAMES: Record<string, string> = {
  '01': 'Regular',
  '02': 'Exonerado',
  '03': 'Super',
  '10': 'Diesel',
};

export const SHIFT_PRESETS = [
  { name: 'Mañana', start: 5, end: 13 },
  { name: 'Tarde', start: 13, end: 21 },
  { name: 'Noche', start: 21, end: 5 },
] as const;

export const SHIFT_BANDS = [
  { name: 'Turno 1 (5-13h)', start: 5, end: 13, color: '#fef3c7', barColor: '#f59e0b' },
  { name: 'Turno 2 (13-21h)', start: 13, end: 21, color: '#e0e7ff', barColor: '#6366f1' },
  { name: 'Turno 3 (21-5h)', start: 21, end: 5, color: '#d1fae5', barColor: '#10b981' },
] as const;

export const WEEKDAYS = [
  { key: 1, short: 'L', name: 'Lunes' },
  { key: 2, short: 'M', name: 'Martes' },
  { key: 3, short: 'X', name: 'Miércoles' },
  { key: 4, short: 'J', name: 'Jueves' },
  { key: 5, short: 'V', name: 'Viernes' },
  { key: 6, short: 'S', name: 'Sábado' },
  { key: 0, short: 'D', name: 'Domingo' },
] as const;

export function getToday(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function formatCurrency(value: number, decimals = 0): string {
  return value.toLocaleString('es-CR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function isInHourRange(hour: number, start: number, end: number): boolean {
  if (start <= end) {
    return hour >= start && hour < end;
  }
  return hour >= start || hour < end;
}

export function classifyVehicle(fuelCode: string | null, liters: number): 'truck' | 'car' | 'motorcycle' {
  const isDiesel = fuelCode === '10';
  if (isDiesel && liters > 50) return 'truck';
  if (liters >= 10) return 'car';
  return 'motorcycle';
}

export function padH(h: number): string {
  return String(h).padStart(2, '0');
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
}
