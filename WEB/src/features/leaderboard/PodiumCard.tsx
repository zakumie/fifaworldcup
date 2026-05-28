import {
  Speed as WinRateIcon,
  MilitaryTech as RankBadgeIcon,
} from '@mui/icons-material';
import type { LeaderboardEntryDto } from '../../types';

export const PODIUM_STYLES = [
  { ring: 'ring-yellow-700', bg: 'bg-gradient-to-br from-yellow-400 to-amber-400', avatarBg: 'bg-yellow-400/20', text: 'text-yellow-800', nameText: 'text-yellow-800', badge: 'bg-yellow-800 text-yellow-200', label: '1st', trophyColor: '#ffd900', cardBg: 'bg-gradient-to-br from-[#fbbf24] via-[#facc15] to-[#eab308]', border: 'border-yellow-500/50', labelColor: 'text-yellow-900', statLabel: 'text-yellow-900', accentIcon: '#a06d05' },
  { ring: 'ring-gray-500', bg: 'bg-gradient-to-br from-slate-300 to-gray-300', avatarBg: 'bg-gray-400/30', text: 'text-gray-600', nameText: 'text-gray-500', badge: 'bg-gray-600 text-gray-200', label: '2nd', trophyColor: '#727478', cardBg: 'bg-gradient-to-br from-[#d1d5db] via-[#e2e8f0] to-[#94a3b8]', border: 'border-zinc-200', labelColor: 'text-gray-600', statLabel: 'text-stone-700', accentIcon: '#363434' },
  { ring: 'ring-stone-100', bg: 'bg-gradient-to-br from-amber-700 to-orange-700', avatarBg: 'bg-amber-900/30', text: 'text-stone-200', nameText: 'text-stone-200', badge: 'bg-stone-300 text-amber-900', label: '3rd', trophyColor: '#ac4d05', cardBg: 'bg-gradient-to-br from-[#854d0e] via-[#713f12] to-[#451a03]', border: 'border-amber-800/50', labelColor: 'text-stone-200', statLabel: 'text-stone-200', accentIcon: '#fefefe' },
];

export function PodiumCard({ entry, style, profitLabel = 'Profit' }: { entry: LeaderboardEntryDto; style: typeof PODIUM_STYLES[0]; profitLabel?: string }) {
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
          <p className={`text-[8px] font-semibold ${style.statLabel} uppercase opacity-70`}>{profitLabel}</p>
          <p className={`text-[11px] font-bold ${style.statLabel} leading-tight`}>
            {entry.profit > 0 ? '+' : ''}{entry.profit.toLocaleString()}
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
