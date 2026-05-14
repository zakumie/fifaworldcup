import { useMemo } from 'react';
import { Skeleton } from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  WorkspacePremium as MedalIcon,
  Speed as WinRateIcon,
  MilitaryTech as RankBadgeIcon,
  EmojiEventsOutlined as EmojiEventsOutlinedIcon
} from '@mui/icons-material';
import { useGetLeaderboardQuery } from './leaderboardApi';
import { useGroupId } from '../groups/useGroupId';
import type { LeaderboardEntryDto } from '../../types';

const PODIUM_STYLES = [
  { ring: 'ring-yellow-700', bg: 'bg-gradient-to-br from-yellow-400 to-amber-400', avatarBg: 'bg-yellow-400/20', text: 'text-yellow-800', nameText: 'text-yellow-800', badge: 'bg-yellow-800 text-yellow-200', label: '1st', trophyColor: '#ffd900', cardBg: 'bg-gradient-to-br from-[#fbbf24] via-[#facc15] to-[#eab308]', border: 'border-yellow-500/50', labelColor: 'text-yellow-900', statLabel: 'text-yellow-900', accentIcon: '#a06d05' },
  { ring: 'ring-gray-500', bg: 'bg-gradient-to-br from-slate-300 to-gray-300', avatarBg: 'bg-gray-400/30', text: 'text-gray-600', nameText: 'text-gray-500', badge: 'bg-gray-600 text-gray-200', label: '2nd', trophyColor: '#727478', cardBg: 'bg-gradient-to-br from-[#d1d5db] via-[#e2e8f0] to-[#94a3b8]', border: 'border-zinc-200', labelColor: 'text-gray-600', statLabel: 'text-gray-700', accentIcon: '#363434' },
  { ring: 'ring-stone-100', bg: 'bg-gradient-to-br from-amber-700 to-orange-700', avatarBg: 'bg-amber-900/30', text: 'text-stone-200', nameText: 'text-stone-200', badge: 'bg-stone-300 text-amber-900', label: '3rd', trophyColor: '#ac4d05', cardBg: 'bg-gradient-to-br from-[#854d0e] via-[#713f12] to-[#451a03]', border: 'border-amber-800/50', labelColor: 'text-stone-200', statLabel: 'text-stone-200', accentIcon: '#fefefe' },
];

function PodiumCard({ entry, style }: { entry: LeaderboardEntryDto; style: typeof PODIUM_STYLES[0] }) {
  return (
    <div className={`relative rounded-xl ${style.cardBg} border ${style.border} hover:shadow-lg hover:shadow-black/20 transition-all duration-300 overflow-hidden`}>
     
      {/* Top section: avatar + name + win rate */}
      <div className="flex items-center gap-3 px-3 pt-4 pb-2.5">
        <div className={`w-10 h-10 rounded-full ${style.avatarBg} ring-[3px] ${style.ring} flex items-center justify-center shrink-0`}>
          {entry.avatarUrl ? (
            <img src={entry.avatarUrl} alt={entry.displayName} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className={`text-base font-black ${style.text}`}>
              {entry.displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-bold ${style.nameText} truncate`}>{entry.displayName}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <WinRateIcon sx={{ fontSize: 18, color: style.accentIcon, opacity: 0.7 }} />
            <span className={`text-md font-black ${style.text} leading-tight`}>{(entry.winRate * 100).toFixed(0)}%</span>
          </div>
        </div>
        {/* Rank badge */}
        <span className={`right-1/2 -translate-x-1/2 px-2.5 py-px rounded-full text-[12px] font-black ${style.badge} shadow-md z-10`}>
          {style.label}
        </span>
        <RankBadgeIcon sx={{ fontSize: 18, color: style.accentIcon }} />
       
      </div>

      {/* Stats row */}
      <div className="flex items-center divide-x divide-black/10 bg-black/10 px-1 py-1.5">
        <div className="flex-1 text-center px-1">
          <p className={`text-[8px] font-semibold ${style.statLabel} uppercase opacity-70`}>W / D / L</p>
          <p className={`text-[11px] font-bold ${style.statLabel} leading-tight`}>{entry.wins}/{entry.draws}/{entry.losses}</p>
        </div>
        <div className="flex-1 text-center px-1">
          <p className={`text-[8px] font-semibold ${style.statLabel} uppercase opacity-70`}>Profit</p>
          <p className={`text-[11px] font-bold ${style.statLabel} leading-tight`}>
            {entry.profit >= 0 ? '+' : ''}{entry.profit.toLocaleString()}
          </p>
        </div>
        <div className="flex-1 text-center px-1">
          <p className={`text-[8px] font-semibold ${style.statLabel} uppercase opacity-70`}>Balance</p>
          <p className={`text-[11px] font-bold ${style.statLabel} leading-tight`}>{entry.balance.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

function RankingRow({ entry }: { entry: LeaderboardEntryDto }) {
  const isTop3 = entry.rank <= 3;
  const profitColor = entry.profit > 0 ? 'text-emerald-600' : entry.profit < 0 ? 'text-red-600' : 'text-gray-500';
  const podiumStyle = isTop3 ? PODIUM_STYLES[entry.rank - 1] : null;

  return (
    <div className={`flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors ${isTop3 ? 'bg-amber-50/30' : ''}`}>
      {/* Rank */}
      <div className="w-8 shrink-0 flex justify-center">
        {podiumStyle ? (
          <TrophyIcon sx={{ fontSize: 20, color: podiumStyle.trophyColor }} />
        ) : (
          <span className="text-sm font-bold text-gray-500">{entry.rank}</span>
        )}
      </div>

      {/* Player */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${podiumStyle ? podiumStyle.bg + ' ' + podiumStyle.text : 'bg-slate-500 text-slate-300'}`}>
          {entry.avatarUrl ? (
            <img src={entry.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            entry.displayName.charAt(0).toUpperCase()
          )}
        </div>
        <span className={`text-sm truncate ${isTop3 ? 'text-gray-700' : 'text-gray-600'}`}>
          {entry.displayName}
        </span>
      </div>

      {/* W/D/L */}
      <div className="hidden sm:flex items-center gap-1 min-w-[120px] justify-center">
        <span className="text-xs font-semibold text-emerald-600">{entry.wins}W</span>
        <span className="text-gray-300">/</span>
        <span className="text-xs font-semibold text-amber-500">{entry.draws}D</span>
        <span className="text-gray-300">/</span>
        <span className="text-xs font-semibold text-red-500">{entry.losses}L</span>
      </div>

      {/* Win Rate */}
      <div className="min-w-[60px] flex justify-center">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
          entry.winRate >= 0.6 ? 'bg-emerald-50 text-emerald-700' : entry.winRate >= 0.4 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'
        }`}>
          {(entry.winRate * 100).toFixed(0)}%
        </span>
      </div>

      {/* Penalty */}
      {entry.penaltyAmount > 0 && (
        <div className="hidden sm:block min-w-[70px] text-right">
          <span className="text-sm font-bold text-stone-500">-{entry.penaltyAmount.toLocaleString()}</span>
        </div>
      )}
      {entry.penaltyAmount <= 0 && (
        <div className="hidden sm:block min-w-[70px] text-right">
          <span className="text-sm text-gray-300">—</span>
        </div>
      )}


      {/* Profit */}
      <div className="hidden sm:block min-w-[70px] text-right">
        <span className={`text-sm font-bold ${profitColor}`}>
          {entry.profit >= 0 ? '+' : ''}{entry.profit.toLocaleString()}
        </span>
      </div>
     
      {/* Balance */}
      <div className="min-w-[70px] text-right">
        <span className="text-sm font-black text-gray-900">{entry.balance.toLocaleString()}</span>
      </div>
    </div>
  );
}

export function LeaderboardPage() {
  const { groupId, groupsLoading } = useGroupId();
  const { data: leaderboard, isLoading, isError } = useGetLeaderboardQuery(
    { groupId },
    { skip: !groupId },
  );

  const top3 = useMemo(() => leaderboard?.slice(0, 3) ?? [], [leaderboard]);

  return (
    <div>
      {/* Dark header */}
      <div className="bg-[#0f1f14] bg-gradient-to-r from-emerald-900 to-emerald-700 rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <EmojiEventsOutlinedIcon sx={{ fontSize: 32, color: 'white' }} />
              <span>LEADER<span className="text-emerald-400">BOARD</span></span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">Top players · Win rates · Rankings</p>
          </div>
          {leaderboard && (
            <div className="text-right hidden sm:block">
              <p className="text-xs text-white font-bold uppercase tracking-wider">Total Players</p>
              <p className="text-lg font-bold text-white">{leaderboard.length}</p>
            </div>
          )}
        </div>
      </div>

      {/* No Group */}
      {!groupId && !groupsLoading && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
            <TrophyIcon sx={{ fontSize: 32, color: '#d97706' }} />
          </div>
          <p className="text-lg font-semibold text-gray-700">No Group Selected</p>
          <p className="text-sm text-gray-500">Join a group to see the leaderboard</p>
        </div>
      )}

      {/* Loading */}
      {(isLoading || groupsLoading) && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" height={200} sx={{ borderRadius: 3 }} />
            ))}
          </div>
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-lg font-semibold text-red-600">Failed to load leaderboard</p>
          <p className="text-sm text-gray-500">Please try again later</p>
        </div>
      )}

      {leaderboard && leaderboard.length > 0 && (
        <div className="space-y-6">
          {/* Top 3 Podium */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[top3[1], top3[0], top3[2]].map((entry, i) => {
                if (!entry) return <div key={i} />;
                return (
                  <div key={entry.userId} className={i === 1 ? 'sm:-mt-2' : 'sm:mt-2'}>
                    <PodiumCard entry={entry} style={PODIUM_STYLES[entry.rank - 1]} />
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Rankings */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <MedalIcon sx={{ fontSize: 20, color: '#10b981' }} />
              <h2 className="text-sm font-bold text-emerald-500 uppercase tracking-wide">Full Rankings</h2>
            </div>

            {/* Table header */}
            <div className="hidden sm:flex items-center gap-3 px-5 py-2.5 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
              <span className="w-8 text-center">#</span>
              <span className="flex-1">Player</span>
              <span className="min-w-[120px] text-center">W / D / L</span>
              <span className="min-w-[70px] text-center">Rate</span>
              <span className="min-w-[70px] text-right">Penalty</span>
              <span className="min-w-[70px] text-right">Profit</span>
              <span className="min-w-[70px] text-right">Balance</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-50">
              {leaderboard.map((entry) => (
                <RankingRow key={entry.userId} entry={entry} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {leaderboard && leaderboard.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
          <TrophyIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
          <p className="text-lg font-semibold text-gray-700">No rankings yet</p>
          <p className="text-sm text-gray-500">Place bets to appear on the leaderboard</p>
        </div>
      )}
    </div>
  );
}
