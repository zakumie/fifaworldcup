import { useCallback, useMemo } from 'react';
import { Skeleton } from '@mui/material';
import {
  SportsSoccer as SportsSoccerIcon,
  Groups as GroupsIcon,
  TrendingUp as TrendingUpIcon,
  HistoryRounded as HistoryRoundedIcon,
  Dashboard as DashboardIcon,
  EmojiEvents as TrophyIcon,
  Percent as WinRateIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';
import { useGetGroupsQuery } from '../groups/groupsApi';
import { useGroupId } from '../groups/useGroupId';
import { useGetMatchesQuery } from '../matches/matchesApi';
import { useGetMyBetsQuery, useGetGroupConfigsQuery } from '../betting/bettingApi';
import { useAppSelector } from '../../app/hooks';
import { useNavigate } from 'react-router-dom';
import { useUserTimeZone } from '../../utils/useUserTimeZone';

const STAT_CARDS = [
  { key: 'groups', label: 'My Groups', path: '/groups', bg: 'bg-gradient-to-br from-emerald-800 to-emerald-700', hoverBg: 'hover:from-emerald-600 hover:to-emerald-600', Icon: GroupsIcon },
  { key: 'upcoming', label: 'Upcoming', path: '/matches', bg: 'bg-gradient-to-br from-emerald-800 to-emerald-700', hoverBg: 'hover:from-emerald-600 hover:to-emerald-600', Icon: SportsSoccerIcon },
  { key: 'winRate', label: 'Win Rate', path: '/bets', bg: 'bg-gradient-to-br from-emerald-800 to-emerald-700', hoverBg: 'hover:from-emerald-600 hover:to-emerald-500', Icon: WinRateIcon },
  { key: 'profit', label: 'Net Profit', path: '/bets', bg: 'bg-gradient-to-br from-emerald-800 to-emerald-700', hoverBg: 'hover:from-emerald-600 hover:to-emerald-500', Icon: TrendingUpIcon },
] as const;

const STATUS_BADGE: Record<string, string> = {
  Won: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  HalfWon: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  Lost: 'bg-red-50 text-red-700 border-red-200',
  HalfLost: 'bg-red-50 text-red-600 border-red-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Push: 'bg-slate-50 text-slate-700 border-slate-200',
  Cancelled: 'bg-gray-50 text-gray-500 border-gray-200',
};

function StatCard({ label, value, Icon, bg, hoverBg, onClick }: {
  label: string;
  value: string | number;
  Icon: typeof GroupsIcon;
  bg: string;
  hoverBg: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-3 p-4 rounded-xl ${bg} ${hoverBg} shadow-sm hover:shadow-lg transition-all duration-200 text-left`}
    >
      <div className="p-2.5 rounded-lg bg-white/15">
        <Icon sx={{ fontSize: 24, color: 'white' }} />
      </div>
      <div>
        <p className="text-xs font-bold text-white uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
      </div>
    </button>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const { formatDate } = useUserTimeZone();
  const { data: groups, isLoading: groupsLoading } = useGetGroupsQuery();
  const { groupId } = useGroupId();
  const matchesArg = useMemo(() => ({}), []);
  const { data: matches, isLoading: matchesLoading } = useGetMatchesQuery(matchesArg);
  const { data: bets, isLoading: betsLoading } = useGetMyBetsQuery({ groupId }, { skip: !groupId });
  const { data: groupConfigs } = useGetGroupConfigsQuery({ groupId }, { skip: !groupId });

  const isLoading = groupsLoading || matchesLoading || betsLoading;

  const configByMatchId = useMemo(() => {
    if (!groupConfigs) return new Map<string, { handicap: number; favoredTeamName: string | null }>();
    return new Map(groupConfigs.map(c => [c.matchId, { handicap: c.handicap, favoredTeamName: c.favoredTeamName }]));
  }, [groupConfigs]);

  const upcomingMatches = useMemo(() => {
    if (!matches) return [];
    const configMatchIds = new Set(groupConfigs?.filter(c => !c.isSettled).map(c => c.matchId) ?? []);
    const bettedMatchIds = new Set(bets?.map(b => b.matchId) ?? []);
    return matches.items.filter(
      (m) => m.status !== 'Finished' && m.status !== 'Cancelled'
        && configMatchIds.has(m.id)
        && !bettedMatchIds.has(m.id),
    );
  }, [matches, groupConfigs, bets]);

  const stats = useMemo(() => {
    if (!bets || bets.length === 0) return { total: 0, wins: 0, winRate: '0', netProfit: 0 };
    const settled = bets.filter((b) => b.status !== 'Pending' && b.status !== 'Cancelled');
    const wins = settled.filter((b) => b.status === 'Won' || b.status === 'HalfWon').length;
    const winRate = settled.length > 0 ? ((wins / settled.length) * 100).toFixed(0) : '0';
    const netProfit = bets.reduce((acc, b) => acc + b.profit, 0);
    return { total: bets.length, wins, winRate, netProfit };
  }, [bets]);

  const recentBets = useMemo(() => bets?.slice(0, 5) ?? [], [bets]);
  const upcomingSlice = useMemo(() => upcomingMatches.slice(0, 5), [upcomingMatches]);
  const todayStr = useMemo(() => formatDate(new Date(), 'MMM dd, yyyy'), [formatDate]);

  const goTo = useCallback((path: string) => () => navigate(path), [navigate]);

  return (
    <div>
      {/* Dark header */}
      <div className="bg-[#0f1f14] bg-gradient-to-r from-emerald-900 to-emerald-700 rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <DashboardIcon sx={{ fontSize: 32, color: 'white' }} />
              <span>DASH<span className="text-emerald-400">BOARD</span></span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Welcome back, <span className="text-emerald-300 font-semibold">{user?.displayName}</span>
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-white uppercase tracking-wider">World Cup 2026</p>
            <p className="text-lg font-bold text-white">{todayStr}</p>
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rectangular" height={90} sx={{ borderRadius: 3 }} />
            ))}
          </div>
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
        </div>
      )}

      {!isLoading && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="My Groups" value={groups?.length ?? 0} Icon={GroupsIcon} bg={STAT_CARDS[0].bg} hoverBg={STAT_CARDS[0].hoverBg} onClick={goTo('/groups')} />
            <StatCard label="Upcoming" value={upcomingMatches.length} Icon={SportsSoccerIcon} bg={STAT_CARDS[1].bg} hoverBg={STAT_CARDS[1].hoverBg} onClick={goTo('/matches')} />
            <StatCard label="Win Rate" value={`${stats.winRate}%`} Icon={WinRateIcon} bg={STAT_CARDS[2].bg} hoverBg={STAT_CARDS[2].hoverBg} onClick={goTo('/bets')} />
            <StatCard
              label="Net Profit"
              value={`${stats.netProfit >= 0 ? '+' : ''}${stats.netProfit.toLocaleString()}`}
              Icon={TrendingUpIcon}
              bg={STAT_CARDS[2].bg} hoverBg={STAT_CARDS[2].hoverBg}
              onClick={goTo('/bets')}
            />
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Matches */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <SportsSoccerIcon sx={{ fontSize: 20, color: '#10b981' }} />
                  <h2 className="text-sm font-bold text-emerald-500 uppercase tracking-wide">Upcoming Matches</h2>
                </div>
                <button
              onClick={goTo('/matches')}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 transition-colors"
                >
                  View All <ArrowIcon sx={{ fontSize: 14 }} />
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {upcomingMatches.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-slate-400">
                    <SportsSoccerIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
                    <p className="text-sm">No upcoming matches</p>
                  </div>
                ) : (
                  upcomingSlice.map((match) => {
                    const cfg = configByMatchId.get(match.id);
                    const handicapLabel = cfg && cfg.handicap !== 0
                      ? `${cfg.favoredTeamName ?? 'Fav'} ${cfg.handicap > 0 ? '+' : ''}${cfg.handicap}`
                      : null;
                    return (
                    <div key={match.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <p className="text-sm font-semibold text-sky-800 truncate">
                            {match.homeTeam.name}
                            </p>
                          <p className="text-sm font-semibold text-gray-400 truncate px-2">
                              vs
                            </p>
                          <p className="text-sm font-semibold text-emerald-800 truncate">
                            {match.awayTeam.name}
                            </p>
                         </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs font-semibold text-green-600">
                            {formatDate(match.startTime, 'MMM dd · HH:mm')}
                          </p>
                        </div>
                      </div>
                        {/* Handicap */}
                        <div className="hidden sm:flex flex-col items-center min-w-[200px]">
                          <span className="text-[10px] font-medium text-gray-400 uppercase mb-0.5">Handicap</span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-600 border border-violet-200 text-xs font-semibold">
                            {handicapLabel ?? 'Even'}
                          </span>
                        </div>
                        <div className="flex flex-col items-center min-w-[100px]">
                          {/* Status */}
                          <span className="text-[10px] font-medium text-gray-400 uppercase mb-0.5">Status</span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${
                            match.status === 'Live' ? 'bg-red-50 text-red-600 border-red-100' :
                            match.status === 'Upcoming' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            'bg-slate-50 text-slate-600 border-slate-100'
                          }`}>
                            {match.status}
                          </span>
                        </div>
                    </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Recent Bets */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <HistoryRoundedIcon sx={{ fontSize: 20, color: '#0b51a0' }} />
                  <h2 className="text-sm font-bold text-sky-700 uppercase tracking-wide">Recent Bets</h2>
                </div>
                <button
                  onClick={goTo('/bets')}
                  className="text-xs font-medium text-sky-700 hover:text-sky-500 flex items-center gap-0.5 transition-colors"
                >
                  View All <ArrowIcon sx={{ fontSize: 14 }} />
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {!bets?.length ? (
                  <div className="flex flex-col items-center py-12 text-slate-400">
                    <TrophyIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
                    <p className="text-sm">No bets yet</p>
                    <p className="text-xs mt-1">Place your first bet from Matches</p>
                  </div>
                ) : (
                  recentBets.map((bet) => {
                    const badgeStyle = STATUS_BADGE[bet.status] || STATUS_BADGE.Cancelled;
                    const profitColor = bet.profit > 0 ? 'text-emerald-600' : bet.profit < 0 ? 'text-red-600' : 'text-gray-400';
                    const handicapLabel = bet.handicap !== 0
                      ? `${bet.favoredTeamName ?? 'Fav'} ${bet.handicap > 0 ? '+' : ''}${bet.handicap}`
                      : null;
                    return (
                      <div key={bet.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                        {/* Match & Time */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <p className="text-sm font-semibold text-sky-800 truncate">
                              {bet.homeTeamName}
                            </p>
                            <p className="text-sm font-semibold text-gray-400 truncate px-2">
                              vs
                            </p>
                            <p className="text-sm font-semibold text-emerald-800 truncate">
                              {bet.awayTeamName}
                            </p>
                          </div>
                          <p className="text-xs font-semibold text-green-600 mt-0.5">
                            {formatDate(bet.createdAt, 'MMM dd · HH:mm')}
                          </p>
                        </div>

                        {/* Handicap */}
                        <div className="hidden sm:flex flex-col items-center min-w-[100px]">
                          <span className="text-[10px] font-medium text-gray-400 uppercase mb-0.5">Handicap</span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-600 border border-violet-200 text-xs font-semibold">
                            {handicapLabel ?? 'Even'}
                          </span>
                        </div>

                        {/* Pick */}
                        <div className="hidden sm:flex flex-col items-center min-w-[170px]">
                          <span className="text-[10px] font-medium text-gray-400 uppercase mb-0.5">Pick</span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 text-xs font-semibold">
                            {bet.selectedTeamName ?? '—'}
                          </span>
                        </div>

                        {/* Amount */}
                        <div className="hidden sm:flex flex-col items-center min-w-[60px]">
                          <span className="text-[10px] font-medium text-gray-400 uppercase mb-0.5">Wager</span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                            {bet.betAmount.toLocaleString()}
                          </span>
                        </div>

                        {/* Profit */}
                        <div className="flex flex-col items-center min-w-[60px]">
                          <span className="text-[10px] font-medium text-gray-400 uppercase mb-0.5">P/L</span>
                          <span className={`text-sm font-bold ${profitColor}`}>
                            {bet.profit > 0 ? '+' : ''}{bet.profit.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex flex-col items-center min-w-[70px]">
                          {/* Status */}
                          <span className="text-[10px] font-medium text-gray-400 uppercase mb-0.5">Status</span>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border uppercase ${badgeStyle}`}>
                            {bet.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
