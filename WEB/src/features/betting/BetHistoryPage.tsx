import { useState, useMemo } from 'react';
import {
  Typography, Skeleton,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  TrendingUp as ProfitIcon,
  Casino as BetIcon,
  Percent as WinRateIcon,
  Search as SearchIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  FavoriteBorderRounded as FavoriteBorderRoundedIcon
} from '@mui/icons-material';

import { useGetMyBetsQuery } from './bettingApi';
import { useGroupId } from '../groups/useGroupId';
import type { BetDto } from '../../types';
import { useUserTimeZone } from '../../utils/useUserTimeZone';

const STATUS_COLORS: Record<string, string> = {
  Won: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  HalfWon: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  Lost: 'bg-red-50 text-red-700 border-red-200',
  HalfLost: 'bg-red-50 text-red-600 border-red-200',
  Push: 'bg-slate-50 text-slate-700 border-slate-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Cancelled: 'bg-gray-50 text-gray-500 border-gray-200',
};

const STATUS_FILTERS = ['All', 'Pending', 'Won', 'Lost', 'Settled'] as const;

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-700 shadow-sm hover:shadow-lg hover:from-emerald-700 hover:to-emerald-600 transition-all duration-200">
      <div className="p-2.5 rounded-lg bg-white/15">
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-white uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function BetRow({ bet }: { bet: BetDto }) {
  const profitColor = bet.profit > 0 ? 'text-emerald-600' : bet.profit < 0 ? 'text-red-600' : 'text-gray-500';
  const statusStyle = STATUS_COLORS[bet.status] || STATUS_COLORS.Cancelled;
  const { formatDate } = useUserTimeZone();

  return (
    <div className="group flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-all duration-200">
      {/* Match Info */}
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
        <p className="text-xs font-semibold text-amber-500">
          {formatDate(bet.createdAt, 'MMM dd · HH:mm')}
        </p>
      </div>

      {/* Pick */}
      <div className="hidden sm:flex flex-col items-center min-w-[80px]">
        <span className="text-[10px] font-medium text-gray-400 uppercase mb-0.5">Pick</span>
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 text-xs font-semibold">
          {bet.selectedTeamName ?? '—'}
        </span>
      </div>

      {/* Amount */}
      <div className="hidden md:flex flex-col items-center min-w-[70px]">
        <span className="text-[10px] font-medium text-gray-400 uppercase mb-0.5">Wager</span>
        <span className="text-sm font-bold text-gray-800">{bet.betAmount.toLocaleString()}</span>
      </div>

      {/* Profit */}
      <div className="flex flex-col items-center min-w-[80px]">
        <span className="text-[10px] font-medium text-gray-400 uppercase mb-0.5">Profit</span>
        <span className={`text-sm font-bold ${profitColor}`}>
          {bet.profit > 0 ? '+' : ''}{bet.profit.toLocaleString()}
        </span>
      </div>

      {/* Status Badge */}
      <div className="min-w-[80px] flex justify-end">
        <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${statusStyle}`}>
          {bet.status}
        </span>
      </div>
    </div>
  );
}

export function BetHistoryPage() {
  const { groupId } = useGroupId();
  const { data, isLoading } = useGetMyBetsQuery({ groupId }, { skip: !groupId });
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const stats = useMemo(() => {
    if (!data || data.length === 0) return { total: 0, wins: 0, winRate: '0', netProfit: 0, totalWagered: 0 };
    const settled = data.filter((b) => b.status !== 'Pending' && b.status !== 'Cancelled');
    const wins = settled.filter((b) => b.status === 'Won' || b.status === 'HalfWon').length;
    const winRate = settled.length > 0 ? ((wins / settled.length) * 100).toFixed(0) : '0';
    const netProfit = data.reduce((acc, b) => acc + b.profit, 0);
    const totalWagered = data.reduce((acc, b) => acc + b.betAmount, 0);
    return { total: data.length, wins, winRate, netProfit, totalWagered };
  }, [data]);

  const { pendingCount, wonCount, lostCount, settledCount } = useMemo(() => {
    if (!data) return { pendingCount: 0, wonCount: 0, lostCount: 0, settledCount: 0 };
    return {
      pendingCount: data.filter((b) => b.status === 'Pending').length,
      wonCount: data.filter((b) => b.status === 'Won' || b.status === 'HalfWon').length,
      lostCount: data.filter((b) => b.status === 'Lost' || b.status === 'HalfLost').length,
      settledCount: data.filter((b) => b.status !== 'Pending' && b.status !== 'Cancelled').length,
    };
  }, [data]);

  const filteredBets = useMemo(() => {
    if (!data) return [];
    let items = [...data];

    if (statusFilter === 'Won') {
      items = items.filter((b) => b.status === 'Won' || b.status === 'HalfWon');
    } else if (statusFilter === 'Lost') {
      items = items.filter((b) => b.status === 'Lost' || b.status === 'HalfLost');
    } else if (statusFilter === 'Pending') {
      items = items.filter((b) => b.status === 'Pending');
    } else if (statusFilter === 'Settled') {
      items = items.filter((b) => b.status !== 'Pending' && b.status !== 'Cancelled');
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (b) =>
          b.homeTeamName.toLowerCase().includes(q) ||
          b.awayTeamName.toLowerCase().includes(q) ||
          (b.selectedTeamName && b.selectedTeamName.toLowerCase().includes(q))
      );
    }

    return items;
  }, [data, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredBets.length / pageSize));
  const paginatedBets = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBets.slice(start, start + pageSize);
  }, [filteredBets, page, pageSize]);

  // Reset to page 1 when filters change
  const handleStatusFilter = (v: string) => { setStatusFilter(v); setPage(1); };
  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  const getTabCount = (tab: string) => {
    if (tab === 'Pending') return pendingCount;
    if (tab === 'Won') return wonCount;
    if (tab === 'Lost') return lostCount;
    if (tab === 'Settled') return settledCount;
    return data?.length ?? 0;
  };

  const getTabCountStyle = (tab: string, isActive: boolean) => {
    if (tab === 'Won') return isActive ? 'bg-emerald-900/20 text-emerald-900' : 'bg-emerald-500/20 text-emerald-400';
    if (tab === 'Lost') return isActive ? 'bg-red-900/20 text-red-900' : 'bg-red-500/20 text-red-400';
    if (tab === 'Pending') return isActive ? 'bg-amber-900/20 text-amber-900' : 'bg-amber-500/20 text-amber-400';
    if (tab === 'Settled') return isActive ? 'bg-purple-900/20 text-purple-900' : 'bg-purple-500/20 text-purple-400';
    return isActive ? 'bg-slate-900/20 text-slate-900' : 'bg-slate-500/20 text-slate-400';
  };

  return (
    <div>
      {/* Dark header section - same style as Matches page */}
      <div className="bg-[#0f1f14] bg-gradient-to-r from-emerald-900 to-emerald-700 rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <FavoriteBorderRoundedIcon sx={{ fontSize: 32, color: 'white' }} />
              <span>MY <span className="text-emerald-400">BETS</span></span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">Track your predictions · Analyze performance</p>
          </div>
        </div>

        {/* Search + Filter row */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <SearchIcon sx={{ fontSize: 20 }} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search teams..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#1a2e1f] border border-[#2d4a35] rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
          <div className="flex items-center gap-1 bg-[#1a2e1f] rounded-xl p-1">
            {STATUS_FILTERS.map((t) => (
              <button
                key={t}
                onClick={() => handleStatusFilter(t)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5
                  ${statusFilter === t
                    ? 'bg-amber-400 text-gray-900 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#243a2a]'
                  }
                `}
              >
                {t}
                {data && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${getTabCountStyle(t, statusFilter === t)}`}>
                    {getTabCount(t)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* No Group State */}
      {!groupId && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
            <BetIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          </div>
          <Typography variant="h6" color="text.secondary" gutterBottom>No Group Selected</Typography>
          <Typography variant="body2" color="text.secondary">Join a group to start tracking your bets</Typography>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: 3 }} />
            ))}
          </div>
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<BetIcon sx={{ fontSize: 24, color: '#fff' }} />}
              label="Total Bets"
              value={stats.total.toString()}
            />
            <StatCard
              icon={<WinRateIcon sx={{ fontSize: 24, color: '#fff' }} />}
              label="Win Rate"
              value={`${stats.winRate}%`}
            />
            <StatCard
              icon={<ProfitIcon sx={{ fontSize: 24, color: '#fff' }} />}
              label="Net Profit"
              value={`${stats.netProfit >= 0 ? '+' : ''} ${stats.netProfit.toLocaleString()}`}
            />
            <StatCard
              icon={<TrophyIcon sx={{ fontSize: 24, color: '#fff' }} />}
              label="Total Wagered"
              value={stats.totalWagered.toLocaleString()}
            />
          </div>

          {/* Bet List */}
          <div className="space-y-2">
            {paginatedBets.map((bet) => (
              <BetRow key={bet.id} bet={bet} />
            ))}

            {filteredBets.length === 0 && data.length > 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <SearchIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
                <p className="text-lg font-medium">No bets match your filter</p>
                <p className="text-sm">Try a different search term or filter</p>
              </div>
            )}

            {data.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <FavoriteBorderRoundedIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
                <p className="text-lg font-medium">No bets yet</p>
                <p className="text-sm">Place your first bet from the Matches page</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredBets.length > pageSize && (
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-600">
              <span>Showing <strong>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredBets.length)}</strong> of {filteredBets.length} bets</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeftIcon sx={{ fontSize: 20 }} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      p === page
                        ? 'bg-emerald-600 text-white'
                        : 'hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRightIcon sx={{ fontSize: 20 }} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
