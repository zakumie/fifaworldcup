import { EmojiEvents as TrophyIcon } from '@mui/icons-material';
import { PODIUM_STYLES } from './PodiumCard';
import type { LeaderboardEntryDto } from '../../types';

export function RankingRow({ entry, onClick }: { entry: LeaderboardEntryDto; onClick?: () => void }) {
  const isTop3 = entry.rank <= 3;
  const profitColor = entry.profit > 0 ? 'text-emerald-600' : entry.profit < 0 ? 'text-red-600' : 'text-gray-500';
  const podiumStyle = isTop3 ? PODIUM_STYLES[entry.rank - 1] : null;

  return (
    <div
      className={`flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${isTop3 ? 'bg-amber-50/30' : ''}`}
      onClick={onClick}
    >
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
          {entry.profit > 0 ? '+' : ''}{entry.profit.toLocaleString()}
        </span>
      </div>
     
      {/* Balance */}
      <div className="min-w-[70px] text-right">
        <span className="text-sm font-black text-gray-900">{entry.balance.toLocaleString()}</span>
      </div>
    </div>
  );
}
