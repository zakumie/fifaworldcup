import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useChangePasswordMutation } from './authApi';
import { useAlert } from '../../components/AlertSnackbar';
import { useTranslation } from 'react-i18next';

export function ChangePasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(t('auth.changePassword.error.allRequired'));
      return;
    }
    if (newPassword.length < 6) {
      setError(t('auth.changePassword.error.minLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth.changePassword.error.mismatch'));
      return;
    }
    if (currentPassword === newPassword) {
      setError(t('auth.changePassword.error.samePassword'));
      return;
    }

    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      setSaved(true);
      showAlert(t('auth.changePassword.success'), 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      const apiErr = err as { data?: { error?: string } };
      setError(apiErr.data?.error ?? t('auth.changePassword.error.failed'));
    }
  };

  const isValid = currentPassword && newPassword.length >= 6 && newPassword === confirmPassword && currentPassword !== newPassword;

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-[#0f1f14] bg-gradient-to-b from-emerald-900 to-emerald-700 rounded-2xl p-4 sm:p-6 mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate('/profile')}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-emerald-800/50 transition-all flex-shrink-0"
          >
            <ArrowBackIcon sx={{ fontSize: 20 }} />
          </button>
          <LockOutlinedIcon sx={{ fontSize: { xs: 26, sm: 32 }, color: 'white' }} />
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">{t('auth.changePassword.title')}</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{t('auth.changePassword.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              {t('auth.changePassword.currentLabel')}
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showCurrent ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              {t('auth.changePassword.newLabel')}
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showNew ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
              </button>
            </div>
            {newPassword && newPassword.length < 6 && (
              <p className="text-[11px] text-red-500 mt-1">{t('auth.changePassword.hint.minChars')}</p>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              {t('auth.changePassword.confirmLabel')}
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showConfirm ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-[11px] text-red-500 mt-1">{t('auth.changePassword.hint.mismatch')}</p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-sm text-red-600 dark:text-red-400 font-medium">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !isValid}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
              saved
                ? 'bg-emerald-500 text-white'
                : isValid
                  ? 'bg-emerald-700 text-white hover:bg-emerald-600 shadow-md shadow-emerald-200 dark:shadow-emerald-900/30'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <CircularProgress size={18} sx={{ color: 'white' }} />
            ) : saved ? (
              <>
                <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />
                {t('auth.changePassword.changedButton')}
              </>
            ) : (
              <>
                <LockOutlinedIcon sx={{ fontSize: 18 }} />
                {t('auth.changePassword.submitButton')}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}