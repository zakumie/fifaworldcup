import { useState } from "react";
import { BetDto } from "@/types";
import { useUserTimeZone } from "@/utils/useUserTimeZone";
import { useTranslation } from "react-i18next";
import { MatchCardDialog } from "./MatchCardDialog";

const STATUS_COLORS: Record<string, string> = {
  Won: "bg-emerald-50 text-emerald-700 border-emerald-200",
  HalfWon: "bg-emerald-50 text-emerald-600 border-emerald-200",
  Lost: "bg-red-50 text-red-700 border-red-200",
  HalfLost: "bg-red-50 text-red-600 border-red-200",
  Push: "bg-slate-50 text-slate-700 border-slate-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Cancelled: "bg-gray-50 text-gray-500 border-gray-200",
};


export function BetRow({ bet, profitLabel }: { bet: BetDto; profitLabel?: string }) {
  const { t } = useTranslation();
  const profitColor = bet.profit > 0 ? 'text-emerald-600' : bet.profit < 0 ? 'text-red-600' : 'text-gray-500';
  const statusStyle = STATUS_COLORS[bet.status] || STATUS_COLORS.Cancelled;
  const { formatDateLocalized } = useUserTimeZone();
  const displayProfitLabel = profitLabel || t('bets.row.profit');
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <MatchCardDialog
        open={dialogOpen}
        bet={bet}
        profitLabel={displayProfitLabel}
        onClose={() => setDialogOpen(false)}
      />
    <div
      onClick={() => setDialogOpen(true)}
      className="group flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-all duration-200 cursor-pointer">
      {/* Match Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          <p className="text-xs sm:text-sm font-semibold text-sky-800 truncate">
            {bet.homeTeamName}
          </p>
          {bet.matchStatus === "Finished" ? (
            <div className="flex item inline-flex items-center mx-2 px-1 sm:px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 text-[10px] sm:text-xs font-semibold truncate max-w-[60px] sm:max-w-none">
              {bet.extraHomeScore && (
                <span className="mx-0.5 px-0.5 text-[10px] sm:text-xs font-semibold text-green-500">
                  ({bet.fullHomeScore})
                </span>
              )}
              <p className="text-[10px] sm:text-xs font-semibold text-sky-500">
                {bet.homeScore}
              </p>

              <p className="text-[10px] sm:text-xs px-1 font-semibold text-sky-500">
                :
              </p>
              <p className="text-[10px] sm:text-xs font-semibold text-sky-500">
                {bet.awayScore}
              </p>
              {bet.extraAwayScore && (
                <span className="mx-0.5 px-0.5 text-[10px] sm:text-xs font-semibold text-green-500">
                  ({bet.fullAwayScore})
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs sm:text-sm font-semibold text-gray-400 truncate px-1 sm:px-2">
              {t("common.vs")}
            </p>
          )}

          <p className="text-xs sm:text-sm font-semibold text-emerald-800 truncate">
            {bet.awayTeamName}
          </p>
        </div>
        <p className="flex items-center py-2 text-[10px] sm:text-xs font-semibold text-amber-500">
          {formatDateLocalized(bet.matchStartTime)}
        </p>
      </div>

      {/* Hadicap */}
      <div className="hidden md:flex flex flex-col items-center min-w-[50px] sm:min-w-[80px]">
        <span className="text-[10px] font-medium text-gray-400 uppercase mb-0.5">
          {t("common.handicap")}
        </span>
        {bet.handicap === 0 ? (
          <span className="inline-flex items-center px-1 sm:px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] sm:text-xs font-semibold truncate max-w-[60px] sm:max-w-none">
            {t("common.even")}
          </span>
        ) : (
          <div className="inline-flex items-center py-2">
            <span className="px-1 sm:px-1.5 py-0.5 mx-1 rounded-md bg-green-50 text-green-700 border border-green-200 text-[10px] sm:text-xs font-semibold truncate max-w-[60px] sm:max-w-none">
              {bet.favoredTeamName}
            </span>
            <span className="px-1 sm:px-1.5 py-0.5 mx:1 rounded-md bg-red-50 text-red-700 border border-red-200 text-[10px] sm:text-xs font-semibold truncate max-w-[60px] sm:max-w-none">
              {bet.handicap}
            </span>
          </div>
        )}
      </div>

      {/* Pick */}
      <div className="flex flex-col items-center min-w-[50px] sm:min-w-[80px]">
        <span className="text-[10px]  font-medium text-gray-400 uppercase mb-0.5">
          {t("common.pick")}
        </span>
        <div className="inline-flex items-center py-2">
          <span className="px-1 sm:px-1.5 py-0.5 mx:1 bg-sky-50 rounded-md text-sky-700 border border-sky-200 text-[10px] sm:text-xs font-semibold truncate max-w-[60px] sm:max-w-none">
            {bet.selectedTeamName ?? "—"}
          </span>
        </div>
      </div>

      {/* LUCKY STAR */}
      <div className="hidden md:flex  flex flex-col items-center min-w-[50px] sm:min-w-[80px]">
        <span className="text-[10px] font-medium text-gray-400 uppercase mb-0.5">
          {t("common.luckyStar")}
        </span>
        <div className="inline-flex items-center py-2">
          {bet.isLuckyStar ? (
            <span className="inline-flex items-center px-2  py-1 sm:px-1.5 py-0.5 rounded-md bg-yellow-50 text-yellow-700 text-[10px] sm:text-xs font-semibold truncate max-w-[60px] sm:max-w-none">
              ⭐
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 sm:px-1.5 py-0.5 rounded-md bg-gray-50 text-gray-700 text-[10px] sm:text-xs font-semibold truncate max-w-[60px] sm:max-w-none">
              {" "}
              🦴
            </span>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="hidden md:flex flex-col items-center min-w-[70px]">
        <span className="text-[10px] font-medium text-gray-400 uppercase mb-0.5">
          {t("common.wager")}
        </span>
        <div className="inline-flex items-center py-2">
          <span className="px-1 sm:px-1.5 py-1 mx:1 text-[10px] sm:text-xs font-semibold text-gray-800">
            {bet.betAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Profit */}
      <div className="flex flex-col items-center min-w-[50px] sm:min-w-[80px]">
        <span className="text-[10px] font-medium text-gray-400 uppercase mb-0.5">
          {displayProfitLabel}
        </span>
        <div className="inline-flex items-center py-2">
          <span
            className={`px-1 sm:px-1.5 py-1 mx:1 text-[10px] sm:text-xs font-semibold ${profitColor}`}
          >
            {bet.profit > 0 ? "+" : ""}
            {bet.profit.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex flex-col">
        <span className="text-[10px] font-medium text-gray-400 uppercase mb-0.5">
          {t("common.status")}
        </span>
        <div className="inline-flex items-center py-2">
          <span
            className={`inline-flex items-center text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full border ${statusStyle}`}
          >
            {t(`bets.status.${bet.status.toLowerCase()}`)}
          </span>
        </div>
      </div>
    </div>
    </>
  );
}
