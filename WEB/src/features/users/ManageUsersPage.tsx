import { useState, useMemo } from 'react';
import {
  Skeleton, IconButton, Chip, Dialog, DialogContent,
  TextField, MenuItem, Avatar, ThemeProvider,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import LockResetIcon from '@mui/icons-material/LockReset';
import { useGetAllUsersQuery, useUpdateUserRoleMutation, useToggleUserActiveMutation, useResetPasswordMutation } from './usersApi';
import { AlertSnackbar, useAlert } from '../../components/AlertSnackbar';
import { useTranslation } from 'react-i18next';
import type { AdminUserDto } from '../../types';
import { getTheme } from '../../app/theme';
import { inputSx } from '../../utils/formStyles';

const lightTheme = getTheme('light');

const STATUS_TABS = ['All', 'Active', 'Inactive'] as const;
const ROLES = ['User', 'Admin'] as const;

export function ManageUsersPage() {
  const { t } = useTranslation();
  const { data: users, isLoading } = useGetAllUsersQuery();
  const [updateRole] = useUpdateUserRoleMutation();
  const [toggleActive] = useToggleUserActiveMutation();
  const [resetPassword] = useResetPasswordMutation();

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(0);
  const { alert, showAlert, closeAlert } = useAlert();
  const [editingUser, setEditingUser] = useState<AdminUserDto | null>(null);
  const [editRole, setEditRole] = useState('');
  const [resetTarget, setResetTarget] = useState<AdminUserDto | null>(null);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    let items = [...users];

    // Tab filter
    const selectedTab = STATUS_TABS[tab];
    if (selectedTab === 'Active') items = items.filter(u => u.isActive);
    else if (selectedTab === 'Inactive') items = items.filter(u => !u.isActive);

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(u =>
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }

    return items;
  }, [users, search, tab]);

  const handleToggleActive = async (user: AdminUserDto) => {
    try {
      await toggleActive({ id: user.id, body: { isActive: !user.isActive } }).unwrap();
      showAlert(
        user.isActive
          ? t('admin.users.deactivated', { name: user.displayName })
          : t('admin.users.reactivated', { name: user.displayName }),
        user.isActive ? 'warning' : 'success'
      );
    } catch {
      showAlert(t('admin.users.failedUpdateStatus'), 'error');
    }
  };

  const handleOpenRoleDialog = (user: AdminUserDto) => {
    setEditingUser(user);
    setEditRole(user.role);
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    try {
      await resetPassword(resetTarget.id).unwrap();
      showAlert(t('admin.users.passwordResetSuccess', { name: resetTarget.displayName }));
      setResetTarget(null);
    } catch {
      showAlert(t('admin.users.failedResetPassword'), 'error');
    }
  };

  const handleSaveRole = async () => {
    if (!editingUser) return;
    try {
      await updateRole({ id: editingUser.id, body: { role: editRole } }).unwrap();
      showAlert(t('admin.users.roleUpdated', { name: editingUser.displayName, role: editRole }));
      setEditingUser(null);
    } catch {
      showAlert(t('admin.users.failedUpdateRole'), 'error');
    }
  };

  const activeCount = users?.filter(u => u.isActive).length ?? 0;
  const adminCount = users?.filter(u => u.role === 'Admin').length ?? 0;

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 sm:gap-3">
              <SettingsIcon sx={{ fontSize: { xs: 24, sm: 28 }, color: '#94a3b8' }} />
              <span>{t('admin.users.title')}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">{t('admin.users.subtitle')}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <SearchIcon sx={{ fontSize: 20 }} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.users.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-4">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700">
            <PeopleIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
            <span className="text-[10px] sm:text-xs text-slate-400">{t('admin.users.stats.total')}:</span>
            <span className="text-[10px] sm:text-xs font-bold text-white">{users?.length ?? 0}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700">
            <CheckCircleIcon sx={{ fontSize: 16, color: '#34d399' }} />
            <span className="text-[10px] sm:text-xs text-slate-400">{t('admin.users.stats.active')}:</span>
            <span className="text-[10px] sm:text-xs font-bold text-emerald-400">{activeCount}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700">
            <AdminPanelSettingsOutlinedIcon sx={{ fontSize: 16, color: '#fbbf24' }} />
            <span className="text-[10px] sm:text-xs text-slate-400">{t('admin.users.stats.admins')}:</span>
            <span className="text-[10px] sm:text-xs font-bold text-amber-400">{adminCount}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-4 bg-slate-800/60 rounded-xl p-1 w-fit">
          {STATUS_TABS.map((label, i) => (
            <button
              key={label}
              onClick={() => setTab(i)}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === i
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t(`admin.users.tabs.${label.toLowerCase()}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rectangular" height={72} sx={{ borderRadius: 3 }} />
          ))}
        </div>
      )}

      {/* Users table */}
      {!isLoading && filteredUsers.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <div className="col-span-4">{t('admin.users.columns.user')}</div>
            <div className="col-span-2 text-center">{t('admin.users.columns.role')}</div>
            <div className="col-span-2 text-center">{t('admin.users.columns.provider')}</div>
            <div className="col-span-2 text-center">{t('admin.users.columns.status')}</div>
            <div className="col-span-2 text-right">{t('admin.users.columns.actions')}</div>
          </div>

          {/* Table rows */}
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className={`grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center px-5 py-4 border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${
                !user.isActive ? 'opacity-60' : ''
              }`}
            >
              {/* User info */}
              <div className="col-span-4 flex items-center gap-3">
                <Avatar
                  src={user.avatarUrl || undefined}
                  sx={{ width: 40, height: 40, bgcolor: '#3b82f6' }}
                >
                  {user.displayName.charAt(0).toUpperCase()}
                </Avatar>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-800 truncate">{user.displayName}</h3>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
              </div>

              {/* Role */}
              <div className="col-span-2 text-center">
                <Chip
                  size="small"
                  label={t(`admin.users.role.${user.role.toLowerCase()}`)}
                  color={user.role === 'Admin' ? 'warning' : 'default'}
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 24 }}
                />
              </div>

              {/* Provider */}
              <div className="col-span-2 text-center">
                <span className="text-xs text-slate-500 capitalize">{user.authProvider}</span>
              </div>

              {/* Status */}
              <div className="col-span-2 text-center">
                <Chip
                  size="small"
                  label={user.isActive ? t('common.active') : t('common.inactive')}
                  color={user.isActive ? 'success' : 'error'}
                  variant="filled"
                  sx={{ fontSize: '0.7rem', height: 24 }}
                />
              </div>

              {/* Actions */}
              <div className="col-span-2 flex items-center justify-end gap-1">
                {user.authProvider.toLowerCase() === 'local' && (
                  <IconButton
                    size="small"
                    onClick={() => setResetTarget(user)}
                    title={t('admin.users.actions.resetPassword')}
                  >
                    <LockResetIcon fontSize="small" sx={{ color: '#f59e0b' }} />
                  </IconButton>
                )}

                <IconButton
                  size="small"
                  onClick={() => handleOpenRoleDialog(user)}
                  title={t('admin.users.actions.changeRole')}
                >
                  <AdminPanelSettingsOutlinedIcon fontSize="small" sx={{ color: '#0860dc' }} />
                </IconButton>
                
                <IconButton
                  size="small"
                  onClick={() => handleToggleActive(user)}
                  title={user.isActive ? t('admin.users.actions.deactivate') : t('admin.users.actions.activate')}
                >
                  {user.isActive ? (
                    <BlockIcon fontSize="small" sx={{ color: '#ef4444' }} />
                  ) : (
                    <CheckCircleIcon fontSize="small" sx={{ color: '#22c55e' }} />
                  )}
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredUsers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <PersonIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
          <p className="text-lg font-medium">{search ? t('admin.users.noResults') : t('admin.users.empty')}</p>
          <p className="text-sm mt-1">
            {search ? t('admin.users.tryDifferentSearch') : t('admin.users.emptyHint')}
          </p>
        </div>
      )}

      {/* Edit Role Dialog */}
      <ThemeProvider theme={lightTheme}>
      <Dialog
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
      >
        {editingUser && (
          <>
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 pt-5 pb-6">
              <IconButton
                onClick={() => setEditingUser(null)}
                size="small"
                sx={{ position: 'absolute', top: 12, right: 12, color: 'white', opacity: 0.8 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
              <div className="flex items-center gap-3">
                <Avatar
                  src={editingUser.avatarUrl || undefined}
                  sx={{ width: 44, height: 44, bgcolor: '#3b82f6' }}
                >
                  {editingUser.displayName.charAt(0).toUpperCase()}
                </Avatar>
                <div>
                  <h2 className="text-white text-lg font-bold">{t('admin.users.editRoleDialog.title')}</h2>
                  <p className="text-slate-400 text-xs">{editingUser.displayName} • {editingUser.email}</p>
                </div>
              </div>
            </div>
            <DialogContent sx={{ pt: 3, pb: 3, px: 3 }}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {t('admin.users.editRoleDialog.systemRole')}
              </p>
              <TextField
                select
                fullWidth
                size="small"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                sx={inputSx}
              >
                {ROLES.map((r) => (
                  <MenuItem key={r} value={r}>{t(`admin.users.role.${r.toLowerCase()}`)}</MenuItem>
                ))}
              </TextField>
              <p className="text-xs text-slate-400 mt-2">
                {t('admin.users.editRoleDialog.hint')}
              </p>
              <button
                onClick={handleSaveRole}
                disabled={editRole === editingUser.role}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SaveIcon sx={{ fontSize: 18 }} />
                {t('admin.users.editRoleDialog.save')}
              </button>
            </DialogContent>
          </>
        )}
      </Dialog>
      </ThemeProvider>

      {/* Reset Password Confirmation Dialog */}
      <ThemeProvider theme={lightTheme}>
      <Dialog
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
      >
        {resetTarget && (
          <>
            <div className="relative bg-gradient-to-br from-amber-600 via-amber-500 to-amber-600 px-6 pt-5 pb-6">
              <IconButton
                onClick={() => setResetTarget(null)}
                size="small"
                sx={{ position: 'absolute', top: 12, right: 12, color: 'white', opacity: 0.8 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
              <div className="flex items-center gap-3">
                <LockResetIcon sx={{ fontSize: 36, color: 'white' }} />
                <div>
                  <h2 className="text-white text-lg font-bold">{t('admin.users.resetDialog.title')}</h2>
                  <p className="text-amber-100 text-xs">{resetTarget.displayName}</p>
                </div>
              </div>
            </div>
            <DialogContent sx={{ pt: 3, pb: 3, px: 3 }}>
              <p className="text-sm text-gray-600">
                  {t('admin.users.resetDialog.confirm', { name: resetTarget.displayName })}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                {t('admin.users.resetDialog.hint')}
              </p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setResetTarget(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleResetPassword}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/25 transition-all duration-200 active:scale-95"
                >
                  <LockResetIcon sx={{ fontSize: 18 }} />
                  {t('admin.users.resetDialog.title')}
                </button>
              </div>
            </DialogContent>
          </>
        )}
      </Dialog>
      </ThemeProvider>

      {/* Alert Snackbar */}
      <AlertSnackbar alert={alert} onClose={closeAlert} />
    </div>
  );
}
