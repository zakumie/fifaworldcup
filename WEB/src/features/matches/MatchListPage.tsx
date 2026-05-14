import { useState, useMemo, memo } from 'react';
import {
  Skeleton, Pagination,
} from '@mui/material';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SearchIcon from '@mui/icons-material/Search';

import { useGetMatchesQuery } from './matchesApi';
import { useGetGroupConfigsQuery, useGetMyBetsQuery } from '../betting/bettingApi';
import { useGroupId } from '../groups/useGroupId';
import { PlaceBetDialog } from '../betting/PlaceBetDialog';
import { ViewBetsDialog } from '../betting/ViewBetsDialog';
import type { BetDto, BettingConfigDto, MatchDto, SettlementMode } from '../../types';
import { formatStage } from '../../utils/formatStage';
import { useUserTimeZone } from '../../utils/useUserTimeZone';

const STATUS_TABS = ['All', 'Upcoming', 'Live', 'Finished', 'My Bets'];

interface MatchCardProps {
  match: MatchDto;
  config?: BettingConfigDto;
  groupId: string;
  myBet?: BetDto;
  settlementMode?: SettlementMode;
}

const BET_STATUS_STYLE: Record<string, string> = {
  Open: 'text-gray-700 bg-gray-50',
  Pending: 'text-amber-700 bg-amber-50',
  Won: 'text-emerald-700 bg-emerald-50',
  HalfWon: 'text-emerald-700 bg-emerald-50',
  Lost: 'text-red-700 bg-red-50',
  HalfLost: 'text-red-700 bg-red-50',
  Push: 'text-slate-700 bg-slate-100',
  Cancelled: 'text-gray-500 bg-gray-100',
};

const MatchCard = memo(function MatchCard({ match, config, groupId, myBet, settlementMode }: MatchCardProps) {
  const [betDialogOpen, setBetDialogOpen] = useState(false);
  const [viewBetsOpen, setViewBetsOpen] = useState(false);
  const { formatDate } = useUserTimeZone();

  const now = Date.now();
  const bettingOpen = config
    ? now >= new Date(config.bettingOpenTime).getTime() && now <= new Date(config.bettingCloseTime).getTime()
    : false;

  const isLive = match.status === 'Live';
  const isFinished = match.status === 'Finished';
  const hasConfig = !!config;
  const isSettled = hasConfig && config.isSettled;
  const showView = (isLive || isFinished) && !!groupId;
  const canBet = hasConfig && !isSettled && bettingOpen && !isLive && !isFinished
    && ((!myBet && !!groupId) || myBet?.status === 'Pending');

  // Status badge: Open → Upcoming → Live → Finished (settled shows as Finished)
  let statusLabel: string;
  let statusStyle: string;

  if (isLive) {
    statusLabel = '● Live';
    statusStyle = 'text-white bg-red-500 animate-pulse';
  } else if (isFinished || isSettled) {
    statusLabel = 'Finished';
    statusStyle = 'text-green-700 bg-green-100';
  } else if (hasConfig) {
    statusLabel = 'Upcoming';
    statusStyle = 'text-blue-600 bg-blue-50';
  } else {
    statusLabel = 'Open';
    statusStyle = 'text-slate-500 bg-slate-100';
  }

  return (
    <>
      <div className={`
        group relative bg-white rounded-2xl border border-gray-100
        shadow-sm hover:shadow-lg transition-all duration-300
        overflow-hidden
        ${isLive ? 'ring-2 ring-red-400/50' : ''}
      `}>
        {isLive && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-red-400 to-orange-400 animate-pulse" />
        )}

        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full">
              {formatStage(match.stage, match.group)}
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusStyle}`}>
                {statusLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 my-5">
            <div className="flex-1 text-center">
              {match.homeTeam.flagUrl && (
                <img src={match.homeTeam.flagUrl} alt="" className="w-10 h-10 mx-auto mb-1.5 rounded-full object-cover shadow-sm" />
              )}
              <p className="text-sm font-bold text-gray-800 leading-tight">{match.homeTeam.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{match.homeTeam.code}</p>
            </div>

            <div className="text-center min-w-[80px]">
              {(!isLive && !isFinished && !isSettled) ? (
                <div className="flex flex-col items-center">
                  <span className="text-lg font-semibold text-slate-400">vs</span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <AccessTimeIcon sx={{ fontSize: 14 }} />
                    {formatDate(match.startTime, 'MMM dd · HH:mm')}
                  </span>
                </div>
              ) : (
                <div className={`
                  inline-flex items-center gap-2 px-4 py-2 rounded-xl
                  ${isLive ? 'bg-red-50' : 'bg-gray-50'}
                `}>
                  <span className="text-2xl font-black text-gray-800">{match.homeScore}</span>
                  <span className="text-lg text-gray-400">-</span>
                  <span className="text-2xl font-black text-gray-800">{match.awayScore}</span>
                </div>
              )}
            </div>

            <div className="flex-1 text-center">
              {match.awayTeam.flagUrl && (
                <img src={match.awayTeam.flagUrl} alt="" className="w-10 h-10 mx-auto mb-1.5 rounded-full object-cover shadow-sm" />
              )}
              <p className="text-sm font-bold text-gray-800 leading-tight">{match.awayTeam.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{match.awayTeam.code}</p>
            </div>
          </div>

          {config && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 mb-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="font-medium text-slate-400">Handicap:</span>
                {config.handicap !== 0 && (
                  <span className="font-bold text-gray-800">
                    {config.favoredTeamName ?? 'Home'} {config.handicap > 0 ? '+' : ''}{config.handicap}
                  </span>
                )}
              </div>
              <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">
                {config.isFixedBet
                  ? `${(config.defaultBetAmount ?? config.minBetAmount).toLocaleString()}`
                  : `${config.minBetAmount.toLocaleString()} - ${config.maxBetAmount.toLocaleString()}`
                }
              </span>
            </div>
          )}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-green-50 border border-slate-100 mb-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="font-medium text-slate-400">Your bet:</span>
              <span className="font-bold text-gray-800">{myBet ? myBet.selectedTeamName : '_'}</span>
            </div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${BET_STATUS_STYLE[myBet ? myBet.status : 'Open'] ?? 'text-gray-600 bg-gray-100'}`}>
              {myBet ? myBet.status : '__'}
            </span>
          </div>

          {(showView || canBet) && (
            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              {showView && (
                <button
                  onClick={() => setViewBetsOpen(true)}
                  className={`${canBet ? 'flex-1' : 'w-full'} justify-center inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 border border-emerald-500 hover:bg-emerald-50 py-3 rounded-xl transition-all duration-200 active:scale-95`}
                >
                  View
                </button>
              )}
              {canBet && (
                <button
                  onClick={() => setBetDialogOpen(true)}
                  className="flex-1 justify-center inline-flex items-center gap-1 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                >
                  {myBet ? 'Update Bet' : 'Bet Now'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {betDialogOpen && config && (
        <PlaceBetDialog
          open={betDialogOpen}
          config={config}
          match={match}
          existingBet={myBet?.status === 'Pending' ? myBet : undefined}
          settlementMode={settlementMode}
          onClose={() => setBetDialogOpen(false)}
        />
      )}

      {viewBetsOpen && groupId && (
        <ViewBetsDialog
          open={viewBetsOpen}
          matchId={match.id}
          groupId={groupId}
          match={match}
          onClose={() => setViewBetsOpen(false)}
        />
      )}
    </>
  );
});

const PAGE_SIZE = 12;

export function MatchListPage() {
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

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

  const filteredMatches = useMemo(() => {
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

    const dir = (activeTab === 'My Bets' || activeTab === 'Finished') ? -1 : 1;
    return items.sort((a, b) => dir * (new Date(a.startTime).getTime() - new Date(b.startTime).getTime()));
  }, [data?.items, search, activeTab, upcomingMatches, myBets]);

  const totalPages = Math.ceil(filteredMatches.length / PAGE_SIZE);
  const paginatedMatches = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredMatches.slice(start, start + PAGE_SIZE);
  }, [filteredMatches, page]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div>
      {/* Dark header section */}
      <div className="bg-[#0f1f14] bg-gradient-to-r from-emerald-900 to-emerald-700 rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <SportsSoccerIcon sx={{ fontSize: 32, color: 'white' }} />
              <span>MATCH <span className="text-emerald-400">CENTER</span></span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">Predict results · Place bets · Win big</p>
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
              placeholder="Search teams..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#1a2e1f] border border-[#2d4a35] rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
          <div className="flex items-center gap-1 bg-[#1a2e1f] rounded-xl p-1">
            {STATUS_TABS.map((t) => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5
                  ${activeTab === t
                    ? 'bg-amber-400 text-gray-900 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#243a2a]'
                  }
                `}
              >
                {t === 'Live' && <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />}
                {t}
                {t === 'Upcoming' && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === t ? 'bg-blue-900/20 text-blue-900' : 'bg-blue-500/20 text-blue-400'}`}>{upcomingCount}</span>}
                {t === 'Live' && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === t ? 'bg-red-900/20 text-red-900' : 'bg-red-500/20 text-red-400'}`}>{liveCount}</span>}
                {t === 'Finished' && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === t ? 'bg-green-900/20 text-green-900' : 'bg-green-500/20 text-green-400'}`}>{finishedCount}</span>}
                {t === 'My Bets' && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === t ? 'bg-amber-900/20 text-amber-900' : 'bg-amber-500/20 text-amber-400'}`}>{myBetsCount}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

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
          <p className="text-lg font-medium">No matches found</p>
          <p className="text-sm">{search ? 'Try a different search term' : 'Try selecting a different filter'}</p>
        </div>
      )}
    </div>
  );
}
