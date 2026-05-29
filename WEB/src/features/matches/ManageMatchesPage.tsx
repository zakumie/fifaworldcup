import { useState, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Tabs, Tab, Skeleton, IconButton, TablePagination,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import TuneIcon from '@mui/icons-material/Tune';
import Groups2Icon from '@mui/icons-material/Groups2';
import SearchIcon from '@mui/icons-material/Search';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

type SortField = 'startTime' | 'status' | 'match';
type SortDirection = 'asc' | 'desc';

import { useGetMatchesQuery } from './matchesApi';
import { useGetGroupConfigsQuery } from '../betting/bettingApi';
import { useGroupId } from '../groups/useGroupId';
import { setSelectedGroupId } from '../groups/groupSlice';
import { useAppDispatch } from '../../app/hooks';
import { MatchAdminDialog } from './MatchAdminDialog';
import type { BettingConfigDto, MatchDto } from '../../types';
import { formatStage } from '../../utils/formatStage';
import { useUserTimeZone } from '../../utils/useUserTimeZone';

const STATUS_TABS = ['All', 'Open', 'Upcoming', 'Live', 'Finished', 'Settled'] as const;

interface MatchRowProps {
  match: MatchDto;
  config?: BettingConfigDto;
  groupId: string;
}

const MatchRow = memo(function MatchRow({ match, config, groupId }: MatchRowProps) {
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const { formatDate } = useUserTimeZone();
  const { t } = useTranslation();

  const isLive = match.status === 'Live';
  const isFinished = match.status === 'Finished';
  const hasConfig = !!config;
  const isSettled = hasConfig && config.isSettled;

  let statusLabel: string;
  let statusStyle: string;
  let iconStyle: string;

  if (isLive) {
    statusLabel = `● ${t('common.filter.live')}`;
    statusStyle = 'text-white bg-red-500 animate-pulse';
    iconStyle = 'bg-gradient-to-br from-pink-600 to-red-700';

  } else if (isSettled) {
    statusLabel = t('common.filter.settled');
    statusStyle = 'text-purple-700 bg-purple-100';
    iconStyle = 'bg-gradient-to-br from-purple-600 to-fuchsia-700';
  } else if (isFinished && !isSettled) {
    statusLabel = t('common.filter.finished');
    statusStyle = 'text-green-700 bg-green-100';
    iconStyle = 'bg-gradient-to-br from-green-600 to-emerald-700';
  } else if (hasConfig) {
    statusLabel = t('common.filter.upcoming');
    statusStyle = 'text-amber-600 bg-amber-50';
    iconStyle = 'bg-gradient-to-br from-amber-500 to-yellow-600';
  } else {
    statusLabel = t('common.filter.open');
    statusStyle = 'text-blue-700 bg-sky-100';
    iconStyle = 'bg-gradient-to-br from-sky-600 to-blue-700';
  }

  return (
    <>
      <div
        onClick={() => setAdminDialogOpen(true)}
        className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer"
      >
        {/* Mobile card layout */}
        <div className="flex sm:hidden items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-lg ${iconStyle} flex items-center justify-center shadow-sm shrink-0`}>
              <SportsSoccerIcon sx={{ fontSize: 16, color: '#fff' }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                {match.homeTeam.flagUrl && (
                  <img src={match.homeTeam.flagUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                )}
                <span className="text-sm font-bold text-gray-800">{match.homeTeam.code}</span>
                <span className="text-[10px] text-slate-400">{t('common.vs')}</span>
                {match.awayTeam.flagUrl && (
                  <img src={match.awayTeam.flagUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                )}
                <span className="text-sm font-bold text-gray-800">{match.awayTeam.code}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-slate-400 truncate">{formatStage(match.stage, match.group)}</span>
                <span className="text-[10px] text-slate-300">·</span>
                <span className="text-[10px] text-blue-800 font-semibold">{formatDate(match.startTime, 'MMM dd, HH:mm')}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {(match.status === 'Open' || match.status === 'Upcoming') ? (
              <span className="text-xs text-slate-400 font-medium">— : —</span>
            ) : (
              <span className={`text-sm font-black ${isLive ? 'text-red-600' : 'text-gray-800'}`}>
                {match.homeScore} - {match.awayScore}
              </span>
            )}
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${statusStyle}`}>
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Desktop table row */}
        <div className="hidden sm:grid grid-cols-12 gap-4 items-center">
          {/* Match teams */}
          <div className="col-span-3 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${iconStyle} flex items-center justify-center shadow-sm shrink-0`}>
              <SportsSoccerIcon sx={{ fontSize: 18, color: '#fff' }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                {match.homeTeam.flagUrl && (
                  <img src={match.homeTeam.flagUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                )}
                <span className="text-sm font-bold text-gray-800 truncate">{match.homeTeam.code}</span>
                <span className="text-xs text-slate-400">{t('common.vs')}</span>
                {match.awayTeam.flagUrl && (
                  <img src={match.awayTeam.flagUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                )}
                <span className="text-sm font-bold text-gray-800 truncate">{match.awayTeam.code}</span>
              </div>
              <p className="text-xs text-blue-800 font-semibold truncate">{formatDate(match.startTime, 'MMM dd, HH:mm')}</p>
            </div>
          </div>

          {/* Stage */}
          <div className="col-span-2 text-center">
            <span className="text-xs text-slate-500">{formatStage(match.stage, match.group)}</span>
          </div>

          {/* Score */}
          <div className="col-span-1 text-center">
            {(match.status === 'Open' || match.status === 'Upcoming') ? (
              <span className="text-sm text-slate-400">— : —</span>
            ) : (
              <span className={`text-sm font-black ${isLive ? 'text-red-600' : 'text-gray-800'}`}>
                {match.homeScore} - {match.awayScore}
              </span>
            )}
          </div>

          {/* Status */}
          <div className="col-span-2 text-center">
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusStyle}`}>
              {statusLabel}
            </span>
          </div>

          {/* Date */}
          <div className="col-span-3 text-center">
            <span className="text-xs text-slate-500">{formatDate(match.startTime, 'MMM dd, HH:mm')}</span>
          </div>

          {/* Action */}
          <div className="col-span-1 flex items-center justify-end">
            <IconButton size="small" title={t('admin.matches.manage')}>
              <TuneIcon fontSize="small" sx={{ color: '#64748b' }} />
            </IconButton>
          </div>
        </div>
      </div>

      {adminDialogOpen && (
        <MatchAdminDialog
          open={adminDialogOpen}
          match={match}
          groupId={groupId}
          config={config}
          onClose={() => setAdminDialogOpen(false)}
        />
      )}
    </>
  );
});

export function ManageMatchesPage() {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('startTime');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const selectedTab = STATUS_TABS[tab];
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const { data, isLoading } = useGetMatchesQuery({ pageSize: 100 });
  const { groupId, groups } = useGroupId();
  const { data: configs } = useGetGroupConfigsQuery({ groupId }, { skip: !groupId });

  const totalMatches = data?.items.length ?? 0;
  const configMap = useMemo(() => {
    const map = new Map<string, BettingConfigDto>();
    configs?.forEach((c) => map.set(c.matchId, c));
    return map;
  }, [configs]);
  const configuredCount = useMemo(() =>
    data?.items.filter((m) => configMap.has(m.id)).length ?? 0,
    [data?.items, configMap]
  );
  const liveCount = useMemo(() =>
    data?.items.filter((m) => m.status === 'Live').length ?? 0,
    [data?.items]
  );

  const filteredMatches = useMemo(() => {
    if (!data?.items) return [];
    let items = data.items;

    // Tab filtering
    if (selectedTab === 'Open') {
      items = items.filter((m) => {
        if (m.status === 'Live' || m.status === 'Finished') return false;
        return !configMap.has(m.id);
      });
    } else if (selectedTab === 'Upcoming') {
      items = items.filter((m) => {
        if (m.status === 'Live' || m.status === 'Finished') return false;
        const cfg = configMap.get(m.id);
        return cfg && !cfg.isSettled;
      });
    } else if (selectedTab === 'Live') {
      items = items.filter((m) => m.status === 'Live');
    } else if (selectedTab === 'Finished') {
      items = items.filter((m) => {
        const cfg = configMap.get(m.id);
        return m.status === 'Finished' && (!cfg || !cfg.isSettled);
      });
    } else if (selectedTab === 'Settled') {
      items = items.filter((m) => {
        const cfg = configMap.get(m.id);
        return cfg?.isSettled;
      });
    }

    // Search filtering
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((m) =>
        m.homeTeam.name.toLowerCase().includes(q) ||
        m.awayTeam.name.toLowerCase().includes(q) ||
        m.homeTeam.code.toLowerCase().includes(q) ||
        m.awayTeam.code.toLowerCase().includes(q)
      );
    }

    return items;
  }, [data?.items, search, selectedTab, configMap]);

  const sortedMatches = useMemo(() => {
    const sorted = [...filteredMatches];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'startTime':
          cmp = new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'match':
          cmp = a.homeTeam.code.localeCompare(b.homeTeam.code);
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [filteredMatches, sortField, sortDirection]);

  const paginatedMatches = useMemo(() =>
    sortedMatches.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sortedMatches, page, rowsPerPage]
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(0);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc'
      ? <ArrowUpwardIcon sx={{ fontSize: 14, ml: 0.5 }} />
      : <ArrowDownwardIcon sx={{ fontSize: 14, ml: 0.5 }} />;
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 sm:gap-3">
              <SettingsIcon sx={{ fontSize: { xs: 24, sm: 28 }, color: '#94a3b8' }} />
              <span>{t('admin.matches.title')}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">{t('admin.matches.subtitle')}</p>
          </div>
          {groups.length > 1 && (
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-800/60 border border-slate-700">
              <Groups2Icon sx={{ fontSize: 18, color: '#94a3b8' }} />
              <select
                value={groupId}
                onChange={(e) => dispatch(setSelectedGroupId(e.target.value))}
                className="text-xs sm:text-sm font-medium text-slate-200 bg-transparent border-none outline-none cursor-pointer py-0 pr-2"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id} className="bg-slate-800 text-slate-200">{g.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <SearchIcon sx={{ fontSize: 20 }} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.matches.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700">
            <SportsSoccerIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
            <span className="text-[10px] sm:text-xs text-slate-400">{t('common.total')}</span>
            <span className="text-[10px] sm:text-xs font-bold text-white">{totalMatches}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700">
            <TuneIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
            <span className="text-[10px] sm:text-xs text-slate-400">{t('admin.matches.configured')}</span>
            <span className="text-[10px] sm:text-xs font-bold text-emerald-400">{configuredCount}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700">
            <span className="w-2 h-2 bg-amber-400 rounded-full" />
            <span className="text-[10px] sm:text-xs text-slate-400">{t('admin.matches.pending')}</span>
            <span className="text-[10px] sm:text-xs font-bold text-amber-400">{totalMatches - configuredCount}</span>
          </div>
          {liveCount > 0 && (
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[10px] sm:text-xs text-red-300">{t('admin.matches.live')}</span>
              <span className="text-[10px] sm:text-xs font-bold text-red-400">{liveCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Box sx={{
        borderBottom: 1,
        borderColor: 'divider',
        mb: 3,
        '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', fontSize: '0.875rem' },
        '& .Mui-selected': { color: '#059669' },
        '& .MuiTabs-indicator': { backgroundColor: '#059669' },
      }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          {STATUS_TABS.map((tab) => <Tab key={tab} label={t(`common.filter.${tab.toLowerCase()}`)} />)}
        </Tabs>
      </Box>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} variant="rectangular" height={64} sx={{ borderRadius: 3 }} />
          ))}
        </div>
      )}

      {/* Matches table/list */}
      {!isLoading && sortedMatches.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <div
              className="col-span-3 flex items-center cursor-pointer hover:text-slate-700 select-none"
              onClick={() => handleSort('match')}
            >
              {t('admin.matches.table.match')} <SortIcon field="match" />
            </div>
            <div className="col-span-2 text-center">{t('admin.matches.table.stage')}</div>
            <div className="col-span-1 text-center">{t('admin.matches.table.score')}</div>
            <div
              className="col-span-2 text-center flex items-center justify-center cursor-pointer hover:text-slate-700 select-none"
              onClick={() => handleSort('status')}
            >
              {t('admin.matches.table.status')} <SortIcon field="status" />
            </div>
            <div
              className="col-span-3 text-center flex items-center justify-center cursor-pointer hover:text-slate-700 select-none"
              onClick={() => handleSort('startTime')}
            >
              {t('admin.matches.table.date')} <SortIcon field="startTime" />
            </div>
            <div className="col-span-1 text-right">{t('admin.matches.table.action')}</div>
          </div>

          {/* Table rows */}
          {paginatedMatches.map((match) => (
              <MatchRow key={match.id} match={match} config={configMap.get(match.id)} groupId={groupId} />
          ))}

          {/* Pagination */}
          <TablePagination
            component="div"
            count={sortedMatches.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50]}
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
              '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                fontSize: '0.8rem',
                color: 'text.secondary',
              },
            }}
          />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && sortedMatches.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <SportsSoccerIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
          <p className="text-lg font-medium">{search ? t('admin.matches.empty.notFound') : t('admin.matches.empty.noMatches')}</p>
          <p className="text-sm mt-1">{search ? t('common.tryDifferentSearch') : t('admin.matches.empty.filterHint')}</p>
        </div>
      )}
    </div>
  );
}
