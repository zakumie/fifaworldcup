import { useCallback } from 'react';
import { useAppSelector } from '../app/hooks';
import { formatInTimeZone, getBrowserTimeZone } from './timezone';

/**
 * Returns the user's timezone and a helper to format UTC dates in that timezone.
 * When timezone changes in Redux (e.g. profile update), all consuming components re-render.
 */
export function useUserTimeZone() {
  const timeZone = useAppSelector((state) => state.auth.user?.timeZone) || getBrowserTimeZone();

  const formatDate = useCallback(
    (utcDate: string | Date, formatStr = 'MMM dd, yyyy') =>
      formatInTimeZone(utcDate, formatStr, timeZone),
    [timeZone],
  );

  return { timeZone, formatDate };
}
