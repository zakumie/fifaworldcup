import { format as fnsFormat, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

/**
 * Convert a UTC date string to the user's timezone and format it.
 * @param utcDate - ISO date string (UTC from API)
 * @param formatStr - date-fns format string (default: 'MMM dd, yyyy')
 * @param timeZone - IANA timezone (e.g. 'Asia/Ho_Chi_Minh')
 */
export function formatInTimeZone(
  utcDate: string | Date,
  formatStr: string,
  timeZone: string,
): string {
  const date = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  const zonedDate = toZonedTime(date, timeZone);
  return fnsFormat(zonedDate, formatStr);
}

export const ALLOWED_TIMEZONES = [
  { value: 'Pacific/Easter', label: 'Pacific/Easter (-6:00)' },
  { value: 'UTC', label: 'Coordinated Universal Time UTC (+0:00)' },
  { value: 'Asia/Ho_Chi_Minh', label: 'Asia/Ho Chi Minh (+7:00)' },
] as const;

/**
 * Get the browser's IANA timezone mapped to the closest allowed timezone.
 */
export function getBrowserTimeZone(): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (ALLOWED_TIMEZONES.some((t) => t.value === tz)) return tz;
  // Map by UTC offset
  const offsetMin = new Date().getTimezoneOffset(); // negative = east of UTC
  if (offsetMin <= -360) return 'Asia/Ho_Chi_Minh'; // UTC+6 or more → HCM
  if (offsetMin >= 300) return 'Pacific/Easter';     // UTC-5 or more west → Easter
  return 'UTC';
}

/**
 * Convert an ISO date string to the format expected by <input type="datetime-local">.
 */
export function toLocalDatetimeInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const VI_WEEKDAYS = ['CN', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7'];
const EN_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Format a datetime based on language preference with relative day labels.
 * - Shows "Today"/"Tomorrow"/"Yesterday" (or Vietnamese equivalents) for near dates.
 * - Otherwise shows weekday + "MMM dd, yyyy · HH:mm".
 */
export function formatDateByLanguage(
  utcDate: string | Date,
  timeZone: string,
  language: string,
): string {
  const date = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  const zonedDate = toZonedTime(date, timeZone);
  const time = fnsFormat(zonedDate, 'HH:mm');

  const isVi = language === 'vi';

  if (isToday(zonedDate)) {
    return `${isVi ? 'Hôm nay' : 'Today'} · ${time}`;
  }
  if (isTomorrow(zonedDate)) {
    return `${isVi ? 'Ngày mai' : 'Tomorrow'} · ${time}`;
  }
  if (isYesterday(zonedDate)) {
    return `${isVi ? 'Hôm qua' : 'Yesterday'} · ${time}`;
  }

  const weekday = isVi
    ? VI_WEEKDAYS[zonedDate.getDay()]
    : EN_WEEKDAYS[zonedDate.getDay()];
  const dateStr = fnsFormat(zonedDate, isVi ? 'dd/MM' : 'MMM dd');

  return `${weekday}, ${isVi ? 'Ngày ' + dateStr : dateStr} · ${time}`;
}
