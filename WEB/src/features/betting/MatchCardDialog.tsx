import { Dialog } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useTranslation } from 'react-i18next';
import type { BetDto } from '../../types';
import { useUserTimeZone } from '../../utils/useUserTimeZone';
import { formatStage } from '@/utils/formatStage';

interface Props {
  open: boolean;
  bet: BetDto;
  profitLabel?: string;
  onClose: () => void;
}

const STATUS_STYLES: Record<string, { bar: string; badge: string; label: string }> = {
  Won: { bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'bets.status.won' },
  HalfWon: { bar: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-600 border-emerald-200', label: 'bets.status.halfwon' },
  Lost: { bar: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-200', label: 'bets.status.lost' },
  HalfLost: { bar: 'bg-red-400', badge: 'bg-red-50 text-red-600 border-red-200', label: 'bets.status.halflost' },
  Push: { bar: 'bg-slate-400', badge: 'bg-slate-50 text-slate-700 border-slate-200', label: 'bets.status.push' },
  Pending: { bar: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200', label: 'bets.status.pending' },
  Cancelled: { bar: 'bg-gray-300', badge: 'bg-gray-50 text-gray-500 border-gray-200', label: 'bets.status.cancelled' },
};

const DIALOG_PAPER_SX = {
  borderRadius: 4,
  overflow: 'hidden',
  bgcolor: 'transparent',
  boxShadow: 'none',
} as const;

function TeamFlag({ flagUrl, name }: { flagUrl: string | null; name: string }) {
  return (
    <div className="flex flex-col items-center gap-1 sm:gap-1.5">
      {flagUrl ? (
        <img src={flagUrl} alt={name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-white shadow-md" />
      ) : (
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-200 flex items-center justify-center text-[10px] sm:text-xs font-bold text-slate-500 ring-2 ring-white shadow-md">
          {name.charAt(0)}
        </div>
      )}
      <span className="text-[11px] sm:text-xs font-semibold text-white/90 max-w-[64px] sm:max-w-[72px] truncate text-center">{name}</span>
    </div>
  );
}

export function MatchCardDialog({ open, bet, profitLabel, onClose }: Props) {
  const { t } = useTranslation();
  const { formatDateLocalized } = useUserTimeZone();

  const statusStyle = STATUS_STYLES[bet.status] ?? STATUS_STYLES.Cancelled;
  const profitColor = bet.profit > 0 ? 'text-emerald-600' : bet.profit < 0 ? 'text-red-600' : 'text-slate-600';
  const profitBackground = bet.profit > 0 ? 'bg-emerald-50' : bet.profit < 0 ? 'bg-red-50' : 'bg-slate-50';
  const profitBorder = bet.profit > 0 ? 'border-emerald-200' : bet.profit < 0 ? 'border-red-200' : 'border-slate-200';
  const handicapLabel =
    bet.handicap !== 0
      ? `${bet.favoredTeamName ?? ''} ${bet.handicap > 0 ? '+' : ''}${bet.handicap}`
      : null;

  const isFinished = bet.matchStatus === 'Finished';
  const hasScore = bet.homeScore !== null && bet.awayScore !== null;
  profitLabel = bet.profit > 0 ? t('common.profit') : bet.profit < 0 ? t('common.loss') : t('common.profitLoss');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: DIALOG_PAPER_SX }}
    >
      <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
        <div className="relative bg-gradient-to-b from-[#1a4527] to-[#2e5b38] px-6 pt-5 pb-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </button>

          {/* Title row */}
          <div className="flex items-center gap-2 mb-4">
            <SportsSoccerIcon sx={{ fontSize: 18, color: "#34d399" }} />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
              {t("matchCard.title")}
            </span>
          </div>

          {/* Teams */}
          <div className="flex items-center justify-center gap-3 sm:gap-5">
            <TeamFlag
              flagUrl={bet.flagHomeTeam}
              name={bet.homeTeamName}
            />

            <div className="flex flex-col items-center gap-1">
              {hasScore ? (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl font-black text-white">
                      {bet.fullHomeScore}
                    </span>
                    <span className="text-base sm:text-lg text-white/40">
                      :
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-white">
                      {bet.fullAwayScore}
                    </span>
                  </div>
                  {bet.extraHomeScore !== null &&
                    bet.extraAwayScore !== null && (
                      <div className="inline-flex items-center text-xs gap-2 px-3 py-2 bg-gray-30">
                        {bet.homeScore ? (
                          <span className="text-amber-600 font-bold">
                            {bet.homeScore}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-bold">
                            <SportsSoccerIcon
                              sx={{ fontSize: 17 }}
                            ></SportsSoccerIcon>
                          </span>
                        )}

                        <span className="text-amber-600">:</span>
                        {bet.awayScore ? (
                          <span className="text-amber-600 font-bold">
                            {bet.awayScore}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-bold">
                            <SportsSoccerIcon
                              sx={{ fontSize: 17 }}
                            ></SportsSoccerIcon>
                          </span>
                        )}
                      </div>
                    )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-white/50">
                  <span className="text-xs sm:text-sm font-medium">VS</span>
                </div>
              )}
            </div>

            <TeamFlag
              flagUrl={bet.flagAwayTeam}
              name={bet.awayTeamName}
            />
          </div>

          {/* Match time */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-white bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
              <AccessTimeIcon sx={{ fontSize: 12 }} />
              {formatDateLocalized(bet.matchStartTime)}
            </span>
            {isFinished && (
              <span className="text-[11px] font-semibold text-green-300 bg-white/10 px-2.5 py-1 rounded-full">
                {t("matchCard.fullTime")}
              </span>
            )}
          </div>

          {/* Stage / group badge */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-500 bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
              {formatStage(bet.stage)}
            </span>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Bet details grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Pick */}
            <div className="flex flex-col gap-1 p-3 rounded-xl bg-sky-50 border border-sky-100">
              <span className="text-[10px] font-semibold text-sky-500 uppercase tracking-wider">
                {t("common.pick")}
              </span>
              <span className="text-sm font-bold text-sky-800">
                {bet.selectedTeamName ?? "—"}
              </span>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                {t("common.status")}
              </span>
              <span
                className={`inline-flex items-center self-start text-xs font-semibold px-2 py-0.5 rounded-full border ${statusStyle.badge}`}
              >
                {t(statusStyle.label)}
              </span>
            </div>

            {/* Handicap */}
            <div className="flex flex-col gap-1 p-3 rounded-xl bg-amber-50 border border-amber-100">
              <span className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider">
                {t("common.handicap")}
              </span>
              <span className="text-sm font-bold text-amber-800">
                {handicapLabel ?? t("common.even")}
              </span>
            </div>

            {/* Wager */}
            <div className="flex flex-col gap-1 p-3 rounded-xl bg-green-50 border border-green-100">
              <span className="text-[10px] font-semibold text-green-500 uppercase tracking-wider">
                {t("common.pointWager")}
              </span>
              <span className="text-sm font-bold text-green-800">
                {bet.betAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Profit / Loss + Lucky Star row */}
          <div className="flex items-center gap-3">
            <div className={`flex-1 flex flex-col gap-1 p-3 rounded-xl ${profitBackground} border ${profitBorder}`}>
              <span className={`text-[10px] font-semibold ${profitColor} uppercase tracking-wider`}>
                {profitLabel}
              </span>
              <span className={`text-xl font-black ${profitColor}`}>
                {bet.profit > 0 ? "+" : ""}
                {bet.profit.toLocaleString()}
              </span>
            </div>

            {/* Lucky Star */}
            {bet.isLuckyStar && (
              <div className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-yellow-50 border border-yellow-200 min-w-[72px]">
                <StarIcon sx={{ fontSize: 24, color: "#f59e0b" }} />
                <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-wide">
                  {t("common.luckyStar")}
                </span>
              </div>
            )}
          </div>

          {/* Settlement date if settled */}
          {bet.settledAt && (
            <div className="flex items-center gap-2 pt-1">
              <EmojiEventsIcon sx={{ fontSize: 14, color: "#6b7280" }} />
              <span className="text-[11px] text-gray-400">
                {t("matchCard.settledAt")} {formatDateLocalized(bet.settledAt)}
              </span>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm font-semibold text-white bg-green-700 hover:bg-green-600 rounded-xl transition-colors border border-gray-100"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
