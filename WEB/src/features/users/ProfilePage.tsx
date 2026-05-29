import { useState, useEffect } from 'react';
import { CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  PersonOutlined as PersonIcon,
  EmailOutlined as EmailIcon,
  CalendarMonthOutlined as CalendarIcon,
  LoginOutlined as AuthIcon,
  SaveOutlined as SaveIcon,
  CameraAltOutlined as CameraIcon,
  CheckCircleOutline as CheckIcon,
  AccessTime as TimezoneIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';

import { useGetProfileQuery, useUpdateProfileMutation } from './usersApi';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { setCredentials } from '../auth/authSlice';
import { getBrowserTimeZone, ALLOWED_TIMEZONES } from '../../utils/timezone';
import { useUserTimeZone } from '../../utils/useUserTimeZone';
import { supportedLanguages } from '../../i18n';

const AVATAR_PRESETS = [
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Leo',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Jade',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Max',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Mia',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Sam',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Zoe',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Kai',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Luna',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Rio',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Ava',
];

export function ProfilePage() {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useGetProfileQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((s) => s.auth.user);
  const authToken = useAppSelector((s) => s.auth.token);
  const authRefreshToken = useAppSelector((s) => s.auth.refreshToken);
  const { formatDate } = useUserTimeZone();

  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [timeZone, setTimeZone] = useState(getBrowserTimeZone());
  const [language, setLanguage] = useState('en');
  const [customUrl, setCustomUrl] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setAvatarUrl(profile.avatarUrl);
      setTimeZone(profile.timeZone || getBrowserTimeZone());
      setLanguage(profile.language || 'en');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError(t('profile.form.error.nameRequired'));
      return;
    }
    setError('');
    try {
      const updated = await updateProfile({ displayName: displayName.trim(), avatarUrl, timeZone, language }).unwrap();
      if (authUser && authToken && authRefreshToken) {
        dispatch(setCredentials({
          accessToken: authToken,
          refreshToken: authRefreshToken,
          user: { ...authUser, displayName: updated.displayName, avatarUrl: updated.avatarUrl, timeZone: updated.timeZone, language: updated.language },
        }));
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError(t('profile.form.error.updateFailed'));
    }
  };

  const handleCustomUrlApply = () => {
    if (customUrl.trim()) {
      setAvatarUrl(customUrl.trim());
      setCustomUrl('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <CircularProgress />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16 bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700 mx-4 sm:mx-0">
        <PersonIcon sx={{ fontSize: 48, color: '#cbd5e1' }} />
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-3">{t('profile.notFound')}</p>
      </div>
    );
  }

  const hasChanges = displayName !== profile.displayName || avatarUrl !== profile.avatarUrl || timeZone !== (profile.timeZone || getBrowserTimeZone()) || language !== (profile.language || 'en');

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0">
      {/* Header */}
      <div className="bg-[#0f1f14] bg-gradient-to-b from-emerald-900 to-emerald-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 sm:gap-3">
          <PersonIcon sx={{ fontSize: { xs: 26, sm: 32 }, color: 'white' }} />
          <span>{t('profile.title')}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">{t('profile.subtitle')}</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Avatar Section */}
        <div className="flex flex-col items-center pt-6 sm:pt-8 pb-4 sm:pb-6 border-b border-stone-200 dark:border-gray-700 bg-gradient-to-r from-gray-200 via-stone-100 to-gray-200 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800">
            <div className="relative group">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-white shadow-lg bg-white"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-emerald-700 to-emerald-600 ring-4 ring-white dark:ring-gray-700 shadow-lg flex items-center justify-center">
                <span className="text-2xl sm:text-3xl font-black text-white">
                  {profile.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <button
              onClick={() => setAvatarUrl(null)}
              className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-700 transition-colors shadow-sm"
              title="Remove avatar"
            >
              <CameraIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />
            </button>
          </div>
          <p className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100 mt-2 sm:mt-3">{profile.displayName}</p>
          <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 max-w-[90%] truncate">{profile.email}</p>
        </div>

        {/* Info & Form */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Read-only info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-gray-800">
              <EmailIcon sx={{ fontSize: 20, color: '#64748b' }} />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">{t('profile.info.email')}</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{profile.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-gray-800">
              <AuthIcon sx={{ fontSize: 20, color: '#64748b' }} />
              <div>
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">{t('profile.info.authProvider')}</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{profile.authProvider}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-gray-800 sm:col-span-2">
              <CalendarIcon sx={{ fontSize: 20, color: '#64748b' }} />
              <div>
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">{t('profile.info.memberSince')}</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{formatDate(profile.createdAt, 'MMMM dd, yyyy')}</p>
              </div>
            </div>
          </div>

          {/* Editable: Display Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              {t('profile.form.displayName')}
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              <TimezoneIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
              {t('profile.form.timezone')}
            </label>
            <select
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            >
              {ALLOWED_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{t('profile.form.timezoneHint')}</p>
          </div>

          {/* Language */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              <LanguageIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
              {t('profile.form.language')}
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            >
              {supportedLanguages.map((lng) => (
                <option key={lng} value={lng}>{t(`language.${lng}`)}</option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{t('profile.form.languageHint')}</p>
          </div>

          {/* Avatar Picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              {t('profile.form.chooseAvatar')}
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {AVATAR_PRESETS.map((url) => (
                <button
                  key={url}
                  onClick={() => setAvatarUrl(url)}
                  className={`w-full aspect-square rounded-xl border-2 overflow-hidden transition-all hover:scale-105 ${
                    avatarUrl === url
                      ? 'border-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-800 shadow-md'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <img src={url} alt="avatar" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Custom URL */}
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder={t('profile.form.avatarUrlPlaceholder')}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                onKeyDown={(e) => e.key === 'Enter' && handleCustomUrlApply()}
              />
              <button
                onClick={handleCustomUrlApply}
                disabled={!customUrl.trim()}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600 disabled:opacity-40 transition-colors sm:w-auto w-full"
              >
                {t('profile.form.applyButton')}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-sm text-red-600 dark:text-red-400 font-medium">
              {error}
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
              saved
                ? 'bg-emerald-500 text-white'
                : hasChanges
                  ? 'bg-emerald-700 text-white hover:bg-emerald-600 shadow-md shadow-emerald-200 dark:shadow-emerald-900/30'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <CircularProgress size={18} sx={{ color: 'white' }} />
            ) : saved ? (
              <>
                <CheckIcon sx={{ fontSize: 18 }} />
                {t('profile.form.savedButton')}
              </>
            ) : (
              <>
                <SaveIcon sx={{ fontSize: 18 }} />
                {t('profile.form.saveButton')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}