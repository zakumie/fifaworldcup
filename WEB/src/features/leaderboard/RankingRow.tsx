import { EmojiEvents as TrophyIcon, ArrowDropUp, ArrowDropDown } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { PODIUM_STYLES } from './PodiumCard';
import type { LeaderboardEntryDto } from '../../types';

function getStreakEmoji(streak: number): string {
  if (streak >= 10) return '🏅';
  if (streak >= 5) return '🔥';
  if (streak === 4) return '😍';
  if (streak === 3) return '🥰';
  if (streak === 2) return '😘';
  if (streak <= 1 && streak >= -1) return '';
  if (streak === -2) return '😭';
  if (streak === -3) return '🤬';
  if (streak === -4) return '🤡';
  if (streak > -10) return '💩';
  return '☠️';
}

export function RankingRow({ entry, onClick }: { entry: LeaderboardEntryDto; onClick?: () => void }) {
  const { t } = useTranslation();
  const isTop3 = entry.rank <= 3;
  const profitColor = entry.profit > 0 ? 'text-emerald-600' : entry.profit < 0 ? 'text-red-600' : 'text-gray-500';
  const podiumStyle = isTop3 ? PODIUM_STYLES[entry.rank - 1] : null;

  return (
    <div
      className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3 hover:bg-gray-50 transition-colors cursor-pointer ${isTop3 ? 'bg-amber-50/30' : ''}`}
      onClick={onClick}
    >
      {/* Rank + Change */}
      <div className="w-7 sm:w-8 shrink-0 flex flex-col items-center gap-0.5">
        {podiumStyle ? (
          <TrophyIcon sx={{ fontSize: { xs: 18, sm: 20 }, color: podiumStyle.trophyColor }} />
        ) : (
          <span className="text-xs sm:text-sm font-bold text-gray-500">{entry.rank}</span>
        )}
        {entry.rankChange !== 0 && (
          <span className={`flex items-center text-[9px] sm:text-[10px] font-bold leading-none ${
            entry.rankChange > 0 ? 'text-emerald-500' : 'text-red-500'
          }`}>
            {entry.rankChange > 0 ? <ArrowDropUp sx={{ fontSize: 12 }} /> : <ArrowDropDown sx={{ fontSize: 12 }} />}
            {Math.abs(entry.rankChange)}
          </span>
        )}
      </div>

      {/* Avatar (with streak badge) + Name + W/D/L */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="relative shrink-0">
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs font-bold ${
            podiumStyle ? podiumStyle.bg + ' ' + podiumStyle.text : 'bg-slate-100 text-slate-500'
          }`}>
            {entry.avatarUrl ? (
              <img src={entry.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              entry.displayName.charAt(0).toUpperCase()
            )}
          </div>
          {entry.streak !== 0 && (
            <span
              className="absolute -top-1.5 -right-1.5 text-sm leading-none drop-shadow-sm"
              title={`Streak: ${entry.streak}`}
            >
              {getStreakEmoji(entry.streak)}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className={`text-sm font-semibold truncate ${isTop3 ? 'text-gray-800' : 'text-gray-700'}`}>
            {entry.displayName}
          </p>
          <div className="flex items-center gap-0.5 mt-0.5 sm:hidden">
            <span className="text-[10px] font-semibold text-emerald-600">{entry.wins}{t('leaderboard.table.win')}</span>
            <span className="text-[10px] text-gray-300">/</span>
            <span className="text-[10px] font-semibold text-amber-500">{entry.draws}{t('leaderboard.table.draw')}</span>
            <span className="text-[10px] text-gray-300">/</span>
            <span className="text-[10px] font-semibold text-red-500">{entry.losses}{t('leaderboard.table.lose')}</span>
          </div>
        </div>
      </div>

      {/* W/D/L (desktop only) */}
      <div className="hidden sm:flex items-center gap-1 min-w-[100px] justify-center">
        <span className="text-xs font-semibold text-emerald-600">{entry.wins}{t('leaderboard.table.win')}</span>
        <span className="text-gray-300">/</span>
        <span className="text-xs font-semibold text-amber-500">{entry.draws}{t('leaderboard.table.draw')}</span>
        <span className="text-gray-300">/</span>
        <span className="text-xs font-semibold text-red-500">{entry.losses}{t('leaderboard.table.lose')}</span>
      </div>

      {/* Win Rate */}
      <div className="min-w-[48px] sm:min-w-[56px] flex justify-center">
        <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
          entry.winRate >= 0.6 ? 'bg-emerald-50 text-emerald-700' : entry.winRate >= 0.4 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'
        }`}>
          {(entry.winRate * 100).toFixed(0)}%
        </span>
      </div>

      {/* Penalty */}
      <div className="hidden sm:block min-w-[60px] text-right">
        {entry.penaltyAmount > 0 ? (
          <span className="text-xs font-bold text-red-500">-{entry.penaltyAmount.toLocaleString()}</span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}        
      </div>

      {/* Reward */}
      <div className="hidden sm:block min-w-[60px] text-right">
        {entry.rewardAmount > 0 ? (
          <span className="text-xs font-bold text-green-500">+{entry.rewardAmount.toLocaleString()}</span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}        
      </div>

      {/* Profit */}
      <div className="hidden sm:block min-w-[65px] text-right">
        <span className={`text-xs font-bold ${profitColor}`}>
          {entry.profit > 0 ? '+' : ''}{entry.profit.toLocaleString()}
        </span>
      </div>

      {/* Balance */}
      <div className="min-w-[60px] sm:min-w-[70px] text-right">
        <span className="text-xs sm:text-sm font-black text-gray-900">{entry.balance.toLocaleString()}</span>
      </div>
    </div>
  );
}
