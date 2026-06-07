import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Skeleton, IconButton, Chip,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import AddIcon from '@mui/icons-material/Add';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useTranslation } from 'react-i18next';
import { useGetAllGroupsQuery } from './groupsApi';
import { CreateGroupDialog } from './CreateGroupDialog';
import { EditGroupDialog } from './EditGroupDialog';
import { AlertSnackbar, useAlert } from '../../components/AlertSnackbar';
import type { GroupDto } from '../../types';

export function ManageGroupsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: groups, isLoading } = useGetAllGroupsQuery();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupDto | null>(null);
  const [search, setSearch] = useState('');
  const { alert, showAlert, closeAlert } = useAlert();

  const filteredGroups = groups?.filter((g) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return g.name.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q);
  });

  const openEditDialog = (group: GroupDto) => {
    setEditingGroup(group);
    setEditOpen(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 sm:gap-3">
              <SettingsIcon sx={{ fontSize: { xs: 24, sm: 28 }, color: '#94a3b8' }} />
              <span>{t('admin.groups.title')}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">{t('admin.groups.subtitle')}</p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 active:scale-95"
          >
            <AddIcon sx={{ fontSize: 18 }} />
            {t('admin.groups.newButton')}
          </button>
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <SearchIcon sx={{ fontSize: 20 }} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.groups.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-4">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700">
            <GroupsIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
            <span className="text-[10px] sm:text-xs text-slate-400">{t('common.total')}</span>
            <span className="text-[10px] sm:text-xs font-bold text-white">{groups?.length ?? 0}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700">
            <PeopleAltIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
            <span className="text-[10px] sm:text-xs text-slate-400">{t('common.active')}:</span>
            <span className="text-[10px] sm:text-xs font-bold text-emerald-400">{groups?.filter(g => g.isActive).length ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rectangular" height={72} sx={{ borderRadius: 3 }} />
          ))}
        </div>
      )}

      {/* Groups table/list */}
      {!isLoading && filteredGroups && filteredGroups.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <div className="col-span-4">{t('admin.groups.table.group')}</div>
            <div className="col-span-2 text-center">{t('admin.groups.table.members')}</div>
            <div className="col-span-2 text-center">{t('admin.groups.table.balance')}</div>
            <div className="col-span-2 text-center">{t('admin.groups.table.mode')}</div>
            <div className="col-span-2 text-right">{t('admin.groups.table.actions')}</div>
          </div>

          {/* Table rows */}
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center px-5 py-4 border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
            >
              {/* Group info */}
              <div className="col-span-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-sm shrink-0">
                  <span className="text-lg font-black text-white leading-none">{group.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-800 truncate">{group.name}</h3>
                  <p className="text-xs text-slate-400 truncate">{group.description || t('common.noDescription')}</p>
                </div>
              </div>

              {/* Members */}
              <div className="col-span-2 text-center">
                <span className="text-sm font-semibold text-gray-700">{group.memberCount}</span>
                <span className="text-xs text-slate-400">/{group.maxMembers}</span>
              </div>

              {/* Balance */}
              <div className="col-span-2 text-center">
                <span className="text-sm font-semibold text-emerald-600">{group.defaultBalance.toLocaleString()}</span>
              </div>

              {/* Settlement Mode */}
              <div className="col-span-2 text-center">
                <Chip
                  size="small"
                  label={group.settlementMode === 'WinnerKeepsLoserPays' ? t('groups.mode.winnerKeeps') : t('groups.mode.normal')}
                  color={group.settlementMode === 'WinnerKeepsLoserPays' ? 'warning' : 'default'}
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 24 }}
                />
              </div>

              {/* Actions */}
              <div className="col-span-2 flex items-center justify-end gap-1">
                <IconButton size="small" onClick={() => navigate(`/groups/${group.id}`)} title={t('admin.groups.viewGroup')}>
                  <VisibilityIcon fontSize="small" sx={{ color: '#64748b' }} />
                </IconButton>
                <IconButton size="small" onClick={() => openEditDialog(group)} title={t('common.edit')}>
                  <EditIcon fontSize="small" sx={{ color: '#64748b' }} />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!filteredGroups || filteredGroups.length === 0) && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <GroupsIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
          <p className="text-lg font-medium">{search ? t('admin.groups.empty.notFound') : t('admin.groups.empty.noGroups')}</p>
          <p className="text-sm mt-1">
            {search ? t('common.tryDifferentSearch') : t('admin.groups.empty.hint')}
          </p>
          {!search && (
            <button
              onClick={() => setCreateOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              <AddIcon sx={{ fontSize: 18 }} />
              {t('admin.groups.createFirst')}
            </button>
          )}
        </div>
      )}

      {/* Create Group Dialog */}
      <CreateGroupDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => {
          setCreateOpen(false);
          showAlert(t('admin.groups.createSuccess'));
          navigate(`/groups/${id}`);
        }}
        onError={(msg) => showAlert(msg, 'error')}
      />

      {/* Edit Group Dialog */}
      <EditGroupDialog
        open={editOpen}
        group={editingGroup}
        onClose={() => { setEditOpen(false); setEditingGroup(null); }}
        onSuccess={(msg) => {
          setEditOpen(false);
          setEditingGroup(null);
          showAlert(msg);
        }}
        onError={(msg) => showAlert(msg, 'error')}
      />

      {/* Snackbar Alert */}
      <AlertSnackbar alert={alert} onClose={closeAlert} />
    </div>
  );
}
