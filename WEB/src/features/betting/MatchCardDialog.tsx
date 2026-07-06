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
  Won:       { bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'bets.status.won' },
  HalfWon:   { bar: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-600 border-emerald-200', label: 'bets.status.halfwon' },
  Lost:      { bar: 'bg-red-500',     badge: 'bg-red-50 text-red-700 border-red-200',             label: 'bets.status.lost' },
  HalfLost:  { bar: 'bg-red-400',     badge: 'bg-red-50 text-red-600 border-red-200',             label: 'bets.status.halflost' },
  Push:      { bar: 'bg-slate-400',   badge: 'bg-slate-50 text-slate-700 border-slate-200',       label: 'bets.status.push' },
  Pending:   { bar: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200',       label: 'bets.status.pending' },
  Cancelled: { bar: 'bg-gray-300',    badge: 'bg-gray-50 text-gray-500 border-gray-200',          label: 'bets.status.cancelled' },
};

const DIALOG_PAPER_SX = {
  borderRadius: 4,
  overflow: 'hidden',
  bgcolor: 'transparent',
  boxShadow: 'none',
} as const;

export function MatchCardDialog({ open, bet, profitLabel, onClose }: Props) {
  const { t } = useTranslation();
  const { formatDateLocalized } = useUserTimeZone();

  const statusStyle = STATUS_STYLES[bet.status] ?? STATUS_STYLES.Cancelled;
  const profitColor =
    bet.profit > 0 ? 'text-emerald-400' : bet.profit < 0 ? 'text-red-400' : 'text-slate-400';
  const displayProfitLabel = profitLabel ?? t('bets.row.profit');

  const handicapLabel =
    bet.handicap !== 0
      ? `${bet.favoredTeamName ?? ''} ${bet.handicap > 0 ? '+' : ''}${bet.handicap}`
      : null;

  const isFinished = bet.matchStatus === 'Finished';

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
          <div className="flex items-center justify-center gap-4">
            {/* Home */}
            <div className="flex-1 text-center">
              {bet.flagHomeTeam && (
                <img
                  src={bet.flagHomeTeam}
                  alt=""
                  className="w-10 h-10 mx-auto mb-1.5 rounded-full object-cover shadow-sm"
                />
              )}
              <p className="text-sm font-bold text-white leading-tight">
                {bet.homeTeamName}
              </p>
              {isFinished && (
                <p className="text-2xl font-black text-emerald-300 mt-1">
                  {bet.fullHomeScore ?? bet.homeScore ?? "–"}
                  {bet.extraHomeScore != null && (
                    <span className="text-sm font-semibold text-green-400 ml-1">
                      ({bet.fullHomeScore})
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Centre divider */}
            <div className="flex flex-col items-center gap-1">
              {isFinished ? (
                <span className="text-lg font-black text-white/40">:</span>
              ) : (
                <span className="text-lg font-black text-white/30">VS</span>
              )}
            </div>

            {/* Away */}
            <div className="flex-1 text-center">
              {bet.flagAwayTeam && (
                <img
                  src={bet.flagAwayTeam}
                  alt=""
                  className="w-10 h-10 mx-auto mb-1.5 rounded-full object-cover shadow-sm"
                />
              )}
              <p className="text-sm font-bold text-white leading-tight">
                {bet.awayTeamName}
              </p>
              {isFinished && (
                <p className="text-2xl font-black text-emerald-300 mt-1">
                  {bet.fullAwayScore ?? bet.awayScore ?? "–"}
                  {bet.extraAwayScore != null && (
                    <span className="text-sm font-semibold text-green-400 ml-1">
                      ({bet.fullAwayScore})
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Match time */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-white bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
              <AccessTimeIcon sx={{ fontSize: 12 }} />
              {formatDateLocalized(bet.matchStartTime)}
            </span>
            {isFinished && (
              <span className="text-[11px] font-semibold text-slate-300 bg-white/10 px-2.5 py-1 rounded-full">
                {t("matchCard.fullTime")}
              </span>
            )}
          </div>

          {/* Stage / group badge */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="lex items-center gap-1 text-[11px] font-semibold text-white bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
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
            <div className="flex flex-col gap-1 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                {t("common.wager")}
              </span>
              <span className="text-sm font-bold text-gray-800">
                {bet.betAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Profit / Loss + Lucky Star row */}
          <div className="flex items-center gap-3">
            <div className="flex-1 flex flex-col gap-1 p-3 rounded-xl bg-gray-900 border border-gray-800">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                {displayProfitLabel}
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
            className="w-full py-2.5 text-sm font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-100"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
