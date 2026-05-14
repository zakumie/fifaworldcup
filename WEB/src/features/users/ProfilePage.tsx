import { useState, useEffect } from 'react';
import { CircularProgress } from '@mui/material';
import {
  PersonOutlined as PersonIcon,
  EmailOutlined as EmailIcon,
  CalendarMonthOutlined as CalendarIcon,
  LoginOutlined as AuthIcon,
  SaveOutlined as SaveIcon,
  CameraAltOutlined as CameraIcon,
  CheckCircleOutline as CheckIcon,
  AccessTime as TimezoneIcon,
} from '@mui/icons-material';

import { useGetProfileQuery, useUpdateProfileMutation } from './usersApi';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { setCredentials } from '../auth/authSlice';
import { getBrowserTimeZone, ALLOWED_TIMEZONES } from '../../utils/timezone';
import { useUserTimeZone } from '../../utils/useUserTimeZone';

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
  const { data: profile, isLoading } = useGetProfileQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((s) => s.auth.user);
  const { formatDate } = useUserTimeZone();

  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [timeZone, setTimeZone] = useState(getBrowserTimeZone());
  const [customUrl, setCustomUrl] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setAvatarUrl(profile.avatarUrl);
      setTimeZone(profile.timeZone || getBrowserTimeZone());
    }
  }, [profile]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }
    setError('');
    try {
      const updated = await updateProfile({ displayName: displayName.trim(), avatarUrl, timeZone }).unwrap();
      if (authUser) {
        const token = sessionStorage.getItem('token');
        const refreshToken = sessionStorage.getItem('refreshToken');
        if (token && refreshToken) {
          dispatch(setCredentials({
            accessToken: token,
            refreshToken,
            user: { ...authUser, displayName: updated.displayName, avatarUrl: updated.avatarUrl, timeZone: updated.timeZone },
          }));
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Failed to update profile');
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
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
        <PersonIcon sx={{ fontSize: 48, color: '#cbd5e1' }} />
        <p className="text-lg font-semibold text-gray-700 mt-3">Profile not found</p>
      </div>
    );
  }

  const hasChanges = displayName !== profile.displayName || avatarUrl !== profile.avatarUrl || timeZone !== (profile.timeZone || getBrowserTimeZone());

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-700 rounded-2xl p-6 mb-6">
        <h1 className="text-2xl font-black text-white flex items-center gap-3">
          <PersonIcon sx={{ fontSize: 32, color: 'white' }} />
          <span>MY <span className="text-emerald-400">PROFILE</span></span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">Manage your account settings</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Avatar Section */}
              <div className="flex flex-col items-center pt-8 pb-6 border-b border-gray-100 bg-gradient-to-b from-slate-100 to-stone-100">
          <div className="relative group">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-lg bg-white"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-700 to-emerald-600 ring-4 ring-white shadow-lg flex items-center justify-center">
                <span className="text-3xl font-black text-white">
                  {profile.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <button
              onClick={() => setAvatarUrl(null)}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-200 transition-colors shadow-sm"
              title="Remove avatar"
            >
              <CameraIcon sx={{ fontSize: 16 }} />
            </button>
          </div>
          <p className="text-lg font-bold text-gray-800 mt-3">{profile.displayName}</p>
          <p className="text-sm text-slate-400">{profile.email}</p>
        </div>

        {/* Info & Form */}
        <div className="p-6 space-y-6">
          {/* Read-only info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
              <EmailIcon sx={{ fontSize: 20, color: '#64748b' }} />
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Email</p>
                <p className="text-sm font-medium text-gray-700">{profile.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
              <AuthIcon sx={{ fontSize: 20, color: '#64748b' }} />
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Auth Provider</p>
                <p className="text-sm font-medium text-gray-700 capitalize">{profile.authProvider}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 sm:col-span-2">
              <CalendarIcon sx={{ fontSize: 20, color: '#64748b' }} />
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Member Since</p>
                <p className="text-sm font-medium text-gray-700">{formatDate(profile.createdAt, 'MMMM dd, yyyy')}</p>
              </div>
            </div>
          </div>

          {/* Editable: Display Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              <TimezoneIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
              Timezone
            </label>
            <select
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            >
              {ALLOWED_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">All times will be displayed in this timezone</p>
          </div>

          {/* Avatar Picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Choose Avatar
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_PRESETS.map((url) => (
                <button
                  key={url}
                  onClick={() => setAvatarUrl(url)}
                  className={`w-full aspect-square rounded-xl border-2 overflow-hidden transition-all hover:scale-105 ${
                    avatarUrl === url
                      ? 'border-emerald-500 ring-2 ring-emerald-200 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={url} alt="avatar" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Custom URL */}
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="Or paste an image URL..."
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                onKeyDown={(e) => e.key === 'Enter' && handleCustomUrlApply()}
              />
              <button
                onClick={handleCustomUrlApply}
                disabled={!customUrl.trim()}
                className="px-4 py-2 rounded-xl bg-slate-100 text-sm font-medium text-gray-600 hover:bg-slate-200 disabled:opacity-40 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 font-medium">
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
                  ? 'bg-emerald-700 text-white hover:bg-emerald-600 shadow-md shadow-emerald-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <CircularProgress size={18} sx={{ color: 'white' }} />
            ) : saved ? (
              <>
                <CheckIcon sx={{ fontSize: 18 }} />
                Saved!
              </>
            ) : (
              <>
                <SaveIcon sx={{ fontSize: 18 }} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}