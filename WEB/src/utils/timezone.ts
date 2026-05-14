import { format as fnsFormat, parseISO } from 'date-fns';
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
