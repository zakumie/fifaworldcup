import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../app/hooks';
import { formatInTimeZone, formatDateByLanguage, getBrowserTimeZone } from './timezone';

/**
 * Returns the user's timezone and helpers to format UTC dates in that timezone.
 * When timezone changes in Redux (e.g. profile update), all consuming components re-render.
 */
export function useUserTimeZone() {
  const timeZone = useAppSelector((state) => state.auth.user?.timeZone) || getBrowserTimeZone();
  const { i18n } = useTranslation();

  const formatDate = useCallback(
    (utcDate: string | Date, formatStr = 'MMM dd, yyyy') =>
      formatInTimeZone(utcDate, formatStr, timeZone),
    [timeZone],
  );

  const formatDateLocalized = useCallback(
    (utcDate: string | Date) =>
      formatDateByLanguage(utcDate, timeZone, i18n.language),
    [timeZone, i18n.language],
  );

  return { timeZone, formatDate, formatDateLocalized };
}
