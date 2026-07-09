import { useUserTimeZone } from "@/utils/useUserTimeZone";
import { PlaceBetDialog } from "../betting/PlaceBetDialog";
import { ViewBetsDialog } from "../betting/ViewBetsDialog";
import { useState } from "react";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { useTranslation } from "react-i18next";
import { formatStage } from "@/utils/formatStage";
import { BetDto, BettingConfigDto, MatchDto, SettlementMode } from "@/types";

interface MatchCardProps {
  match: MatchDto;
  config?: BettingConfigDto;
  groupId: string;
  myBet?: BetDto;
  settlementMode?: SettlementMode;
}

const BET_STATUS_STYLE: Record<string, string> = {
  Open: "text-gray-700 bg-gray-50",
  Pending: "dark:text-gray-700 bg-gray-100",
  Won: "text-emerald-700 bg-emerald-50",
  HalfWon: "text-emerald-700 bg-emerald-50",
  Lost: "text-red-700 bg-red-50",
  HalfLost: "text-red-700 bg-red-50",
  Push: "text-slate-700 bg-slate-100",
  Cancelled: "text-gray-500 bg-gray-100",
};

const LUCKY_STAR_STLYE: Record<string, string> = {
  Normal: "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700",
  LuckyStar: "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700",
};

export function MatchCard({
  match,
  config,
  groupId,
  myBet,
  settlementMode,
}: MatchCardProps) {
  const { t } = useTranslation();
  const [betDialogOpen, setBetDialogOpen] = useState(false);
  const [viewBetsOpen, setViewBetsOpen] = useState(false);
  const { formatDateLocalized } = useUserTimeZone();

  const now = Date.now();
  const bettingOpen = config
    ? now >= new Date(config.bettingOpenTime).getTime() &&
      now <= new Date(config.bettingCloseTime).getTime()
    : false;

  const isLive = match.status === "Live";
  const isFinished = match.status === "Finished";
  const hasConfig = !!config;
  const isSettled = hasConfig && config.isSettled;
  const showView = (isLive || isFinished || isSettled) && !!groupId;
  const canBet =
    hasConfig &&
    !isSettled &&
    bettingOpen &&
    !isLive &&
    !isFinished &&
    ((!myBet && !!groupId) || myBet?.status === "Pending");

  // Status badge: Open → Upcoming → Live → Finished (settled shows as Finished)
  let statusLabel: string;
  let statusStyle: string;

  if (isLive) {
    statusLabel = t("matches.status.live");
    statusStyle = "text-white bg-red-500 animate-pulse";
  } else if (isFinished || isSettled) {
    statusLabel = t("matches.status.finished");
    statusStyle = "text-green-700 bg-green-100";
  } else if (hasConfig) {
    statusLabel = t("matches.status.upcoming");
    statusStyle = "text-amber-600 bg-amber-50";
  } else {
    statusLabel = t("matches.status.open");
    statusStyle = "text-slate-500 bg-slate-100";
  }

  return (
    <>
      <div
        className={`
        group relative bg-white rounded-2xl border border-gray-100
        shadow-sm hover:shadow-lg transition-all duration-300
        overflow-hidden
        ${isLive ? "ring-2 ring-red-400/50" : ""}
        ${!myBet && hasConfig && !isLive && !isFinished && !isSettled ? "ring-1 ring-emerald-400 bg-emerald-50/30" : ""}
      `}
      >
        {isLive && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-red-400 to-orange-400 animate-pulse" />
        )}

        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
              {formatStage(match.stage, match.group)}
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusStyle}`}
              >
                {statusLabel}
              </span>
            </div>
          </div>

          <div
            className="flex items-center justify-center gap-3 my-5 cursor-pointer"
            onClick={() =>
              settlementMode === "WinnerKeepsLoserPays" && setViewBetsOpen(true)
            }
          >
            <div className="flex-1 text-center">
              {match.homeTeam.flagUrl && (
                <img
                  src={match.homeTeam.flagUrl}
                  alt=""
                  className="w-10 h-10 mx-auto mb-1.5 rounded-full object-cover shadow-sm"
                />
              )}
              <p className="text-sm font-bold text-gray-800 leading-tight">
                {match.homeTeam.name}
              </p>
            </div>

            <div className="text-center min-w-[80px]">
              {!isLive && !isFinished && !isSettled ? (
                <div className="flex flex-col items-center">
                  <span className="text-lg font-semibold text-slate-400">
                    {t("common.vs")}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <AccessTimeIcon sx={{ fontSize: 14 }} />
                    {formatDateLocalized(match.startTime)}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`
                    inline-flex items-center gap-2 px-4 py-2 rounded-xl
                    ${isLive ? "bg-red-50" : "bg-gray-50"}
                  `}
                  >
                    <span className="text-2xl font-black text-gray-800">
                      {match.fullHomeScore}
                    </span>
                    <span className="text-lg text-gray-400">-</span>
                    <span className="text-2xl font-black text-gray-800">
                      {match.fullAwayScore}
                    </span>
                  </div>
                  {match.extraHomeScore !== null &&
                    match.extraAwayScore !== null && (
                      <div className="inline-flex items-center text-xs gap-2 px-4 py-2 bg-gray-30">
                        <span className="tex-amber-600 font-bold">90' : </span>
                        {match.homeScore ? (
                          <span className="text-amber-600 font-bold">
                            {match.homeScore}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-bold">
                            <SportsSoccerIcon
                              sx={{ fontSize: 17 }}
                            ></SportsSoccerIcon>
                          </span>
                        )}

                        <span className="text-amber-600">-</span>
                        {match.awayScore ? (
                          <span className="text-amber-600 font-bold">
                            {match.awayScore}
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
              )}
            </div>

            <div className="flex-1 text-center">
              {match.awayTeam.flagUrl && (
                <img
                  src={match.awayTeam.flagUrl}
                  alt=""
                  className="w-10 h-10 mx-auto mb-1.5 rounded-full object-cover shadow-sm"
                />
              )}
              <p className="text-sm font-bold text-gray-800 leading-tight">
                {match.awayTeam.name}
              </p>
            </div>
          </div>

          {config && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 mb-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="font-medium text-slate-400">
                  {t("common.handicap")}:
                </span>
                {config.handicap !== 0 ? (
                  <span className="font-bold text-gray-800">
                    {config.favoredTeamName ?? t("common.home")}{" "}
                    {config.handicap > 0 ? "+" : ""}
                    {config.handicap}
                  </span>
                ) : (
                  <span className="font-bold text-gray-800">
                    {t("common.even")}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">
                  {config.isFixedBet
                    ? `${(config.defaultBetAmount ?? config.minBetAmount).toLocaleString()}`
                    : `${config.minBetAmount.toLocaleString()} - ${config.maxBetAmount.toLocaleString()}`}
                </span>
              </div>
            </div>
          )}
          <div
            className={`flex items-center justify-between px-3 py-2 rounded-xl ${myBet?.isLuckyStar ? "bg-blue-50" : "bg-green-50"} border border-slate-100 mb-3`}
          >
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="font-medium text-slate-400">
                {t("matches.card.yourBet")}
              </span>
              <span className="font-bold text-gray-800">
                {myBet ? myBet.selectedTeamName : "_"}
              </span>
              {myBet?.isLuckyStar && (
                <span
                  className="text-amber-400 text-[14px] font-bold"
                  title="Lucky Star"
                >
                  ⭐️
                </span>
              )}
            </div>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${BET_STATUS_STYLE[myBet ? myBet.status : "Open"] ?? "text-gray-600 bg-gray-100"}`}
            >
              {myBet ? t(`bets.status.${myBet.status.toLowerCase()}`) : "__"}
            </span>
          </div>

          {(showView || canBet) && (
            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              {showView && (
                <button
                  onClick={() => setViewBetsOpen(true)}
                  className={`${canBet ? "flex-1" : "w-full"} justify-center inline-flex
                  items-center gap-1 text-xs font-semibold 
                  text-emerald-600 border border-emerald-500
                  hover:bg-emerald-50 py-3 rounded-xl transition-all duration-200 active:scale-95`}
                >
                  {t("matches.card.viewButton")}
                </button>
              )}
              {canBet && (
                <button
                  onClick={() => setBetDialogOpen(true)}
                  className={`flex-1 justify-center inline-flex items-center 
                  gap-1 text-xs font-semibold text-white ${myBet?.isLuckyStar ? LUCKY_STAR_STLYE.LuckyStar : LUCKY_STAR_STLYE.Normal}
                  py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95`}
                >
                  {myBet
                    ? t("matches.card.updateBet")
                    : t("matches.card.betNow")}
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
          existingBet={myBet?.status === "Pending" ? myBet : undefined}
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
};