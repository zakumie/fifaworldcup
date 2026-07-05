import { useState, useMemo } from 'react';
import {
  Skeleton, Pagination,
} from '@mui/material';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import SearchIcon from '@mui/icons-material/Search';
import { useGetMatchesQuery } from './matchesApi';
import { useGetGroupConfigsQuery, useGetMyBetsQuery } from '../betting/bettingApi';
import { useGroupId } from '../groups/useGroupId';
import type { BetDto, BettingConfigDto, MatchDto } from '../../types';
import { useTranslation } from 'react-i18next';
import { MatchCard } from './MatchCard';

const STATUS_TABS = ['All', 'Upcoming', 'Live', 'Finished', 'My Bets'];

const TAB_I18N_KEY: Record<string, string> = {
  All: 'common.filter.all',
  Upcoming: 'common.filter.upcoming',
  Live: 'common.filter.live',
  Finished: 'common.filter.finished',
  'My Bets': 'common.filter.myBets',
};

const STAGE_OPTIONS = [
  'ALL', 'GROUP_STAGE', 'LAST_32', 'LAST_16',
  'QUARTER_FINALS', 'SEMI_FINALS', 'THIRD_PLACE', 'FINAL',
] as const;

type StageFilter = typeof STAGE_OPTIONS[number];

const STAGE_I18N_KEY: Record<string, string> = {
  ALL: 'common.filter.all',
  GROUP_STAGE: 'matches.stage.groupStage',
  LAST_32: 'matches.stage.last32',
  LAST_16: 'matches.stage.last16',
  QUARTER_FINALS: 'matches.stage.quarterFinals',
  SEMI_FINALS: 'matches.stage.semiFinals',
  THIRD_PLACE: 'matches.stage.thirdPlace',
  FINAL: 'matches.stage.final',
};

const PAGE_SIZE = 12;

export function MatchListPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [betFilter, setBetFilter] = useState<'all' | 'not-bet' | 'betted'>('all');
  const [stageFilter, setStageFilter] = useState<StageFilter>('ALL');

  const { data, isLoading } = useGetMatchesQuery({ pageSize: 100 });
  const { groupId, groups } = useGroupId();
  const { data: configs } = useGetGroupConfigsQuery({ groupId }, { skip: !groupId });
  const { data: myBets } = useGetMyBetsQuery({ groupId }, { skip: !groupId });

  const activeGroup = groups.find((g) => g.id === groupId);

  const upcomingMatches = useMemo(() => {
    if (!data?.items || !configs) return [];
    return data.items.filter((m) => {
      if (m.status === 'Live' || m.status === 'Finished') return false;
      const cfg = configs.find((c) => c.matchId === m.id);
      return cfg && !cfg.isSettled;
    });
  }, [data?.items, configs]);

  const { upcomingCount, liveCount, finishedCount, myBetsCount } = useMemo(() => ({
    upcomingCount: upcomingMatches.length,
    liveCount: data?.items.filter((m) => m.status === 'Live').length ?? 0,
    finishedCount: data?.items.filter((m) => m.status === 'Finished').length ?? 0,
    myBetsCount: myBets?.length ?? 0,
  }), [upcomingMatches, data?.items, myBets]);

  const configMap = useMemo(() => {
    const map = new Map<string, BettingConfigDto>();
    configs?.forEach((c) => map.set(c.matchId, c));
    return map;
  }, [configs]);

  const betMap = useMemo(() => {
    const map = new Map<string, BetDto>();
    myBets?.forEach((b) => map.set(b.matchId, b));
    return map;
  }, [myBets]);

  // Tab + search + betFilter filtered items — no stage filter applied yet (used for counts)
  const baseFilteredItems = useMemo(() => {
    if (!data?.items) return [];
    let items: MatchDto[];

    if (activeTab === 'Open') {
      items = data.items.filter((m) => {
        if (m.status === 'Live' || m.status === 'Finished') return false;
        const cfg = configs?.find((c) => c.matchId === m.id);
        return !cfg;
      });
    } else if (activeTab === 'Upcoming') {
      items = upcomingMatches;
      if (betFilter === 'not-bet') {
        items = items.filter((m) => !myBets?.some((b) => b.matchId === m.id));
      } else if (betFilter === 'betted') {
        items = items.filter((m) => myBets?.some((b) => b.matchId === m.id));
      }
    } else if (activeTab === 'Live') {
      items = data.items.filter((m) => m.status === 'Live');
    } else if (activeTab === 'Finished') {
      items = data.items.filter((m) => m.status === 'Finished');
    } else if (activeTab === 'My Bets') {
      items = data.items.filter((m) => myBets?.some((b) => b.matchId === m.id));
    } else {
      items = [...data.items];
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (m) =>
          m.homeTeam.name.toLowerCase().includes(q) ||
          m.homeTeam.code.toLowerCase().includes(q) ||
          m.awayTeam.name.toLowerCase().includes(q) ||
          m.awayTeam.code.toLowerCase().includes(q)
      );
    }

    return items;
  }, [data?.items, search, activeTab, upcomingMatches, myBets, betFilter, configs]);

  const stageCountMap = useMemo(() => {
    const map = new Map<string, number>();
    baseFilteredItems.forEach((m) => {
      map.set(m.stage, (map.get(m.stage) ?? 0) + 1);
    });
    return map;
  }, [baseFilteredItems]);

  const availableStages = useMemo(
    () => STAGE_OPTIONS.filter((s) => s === 'ALL' || (stageCountMap.get(s) ?? 0) > 0),
    [stageCountMap],
  );

  const filteredMatches = useMemo(() => {
    const items = stageFilter !== 'ALL'
      ? baseFilteredItems.filter((m) => m.stage === stageFilter)
      : [...baseFilteredItems];
    const dir = (activeTab === 'My Bets' || activeTab === 'Finished' || activeTab === 'All') ? -1 : 1;
    return items.sort((a, b) => dir * (new Date(a.startTime).getTime() - new Date(b.startTime).getTime()));
  }, [baseFilteredItems, stageFilter, activeTab]);

  const totalPages = Math.ceil(filteredMatches.length / PAGE_SIZE);
  const paginatedMatches = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredMatches.slice(start, start + PAGE_SIZE);
  }, [filteredMatches, page]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
    setStageFilter('ALL');
    if (tab !== 'Upcoming') setBetFilter('all');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div>
      {/* Dark header section */}
      <div className="bg-[#0f1f14] bg-gradient-to-b from-emerald-900 to-emerald-700 rounded-2xl p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 sm:gap-3">
              <SportsSoccerIcon sx={{ fontSize: { xs: 26, sm: 32 }, color: 'white' }} />
              <span>{t('matches.list.titleMatch')} <span className="text-emerald-400">{t('matches.list.titleCenter')}</span></span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">{t('matches.list.subtitle')}</p>
          </div>
        </div>

        {/* Search + Filter row */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <SearchIcon sx={{ fontSize: 20 }} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder={t('matches.list.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2.5 bg-[#1a2e1f] border border-[#2d4a35] rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
          <div className="flex items-center gap-1 bg-[#1a2e1f] rounded-xl p-1 overflow-x-auto scrollbar-hide">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`
                  px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1 sm:gap-1.5 whitespace-nowrap flex-shrink-0
                  ${activeTab === tab
                    ? 'bg-amber-400 text-gray-900 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#243a2a]'
                  }
                `}
              >
                {tab === 'Live' && <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />}
                {t(TAB_I18N_KEY[tab])}
                {tab === 'Upcoming' && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-blue-900/20 text-blue-900' : 'bg-blue-500/20 text-blue-400'}`}>{upcomingCount}</span>}
                {tab === 'Live' && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-red-900/20 text-red-900' : 'bg-red-500/20 text-red-400'}`}>{liveCount}</span>}
                {tab === 'Finished' && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-green-900/20 text-green-900' : 'bg-green-500/20 text-green-400'}`}>{finishedCount}</span>}
                {tab === 'My Bets' && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-amber-900/20 text-amber-900' : 'bg-amber-500/20 text-amber-400'}`}>{myBetsCount}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bet filter toggle for Upcoming */}
      {activeTab === 'Upcoming' && (
        <div className="flex items-center gap-1 mb-4 bg-gray-100 dark:bg-gray-900 rounded-xl p-1 w-fit border border-gray-200 dark:border-gray-700">
          {(['all', 'not-bet', 'betted'] as const).map((filter) => {
            const isActive = betFilter === filter;
            const activeStyle =
              filter === 'all'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : filter === 'not-bet'
                  ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 shadow-sm'
                  : 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shadow-sm';
            const inactiveStyle =
              'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-700/60';
            return (
              <button
                key={filter}
                onClick={() => { setBetFilter(filter); setPage(1); }}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1
                  ${isActive ? activeStyle : inactiveStyle}
                `}
              >
                {filter === 'not-bet' && (
                  <span className={`${isActive ? 'bg-amber-500 dark:bg-amber-400' : 'bg-gray-400 dark:bg-gray-500'}`} />
                )}
                {filter === 'betted' && (
                  <span className={`${isActive ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-gray-400 dark:bg-gray-500'}`} />
                )}
                {t(`matches.list.betFilter.${filter}`)}
              </button>
            );
          })}
        </div>
      )}

      {/* Stage filter — Finished & My Bets */}
      {(activeTab === 'Finished' || activeTab === 'My Bets' || activeTab === 'All') && availableStages.length > 1 && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
            {availableStages.map((stage) => {
              const isActive = stageFilter === stage;
              const count = stage === 'ALL'
                ? baseFilteredItems.length
                : (stageCountMap.get(stage) ?? 0);
              return (
                <button
                  key={stage}
                  onClick={() => { setStageFilter(stage); setPage(1); }}
                  className={`
                    flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                    border transition-all duration-200 whitespace-nowrap
                    ${
                      isActive
                        ? 'bg-emerald-600 dark:bg-emerald-500 border-emerald-600 dark:border-emerald-500 text-white shadow-sm'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-emerald-400 dark:hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400'
                    }
                  `}
                >
                  {t(STAGE_I18N_KEY[stage])}
                  <span
                    className={`
                      text-[10px] font-bold px-1.5 py-1.5 rounded-full leading-none
                      ${
                        isActive
                          ? 'bg-white/25 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }
                    `}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Match grid */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} variant="rectangular" height={220} sx={{ borderRadius: 3 }} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedMatches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            config={configMap.get(match.id)}
            groupId={groupId}
            myBet={betMap.get(match.id)}
            settlementMode={activeGroup?.settlementMode}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            color="primary"
            shape="rounded"
          />
        </div>
      )}

      {!isLoading && filteredMatches.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <SportsSoccerIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
          <p className="text-lg font-medium">{t('matches.list.empty.notFound')}</p>
          <p className="text-sm">{search ? t('common.tryDifferentSearch') : t('matches.list.empty.filterHint')}</p>
        </div>
      )}
    </div>
  );
}
