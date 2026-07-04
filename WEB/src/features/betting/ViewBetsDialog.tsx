import { useMemo } from 'react';
import {
  Dialog, DialogContent, IconButton,
  Skeleton, ThemeProvider, useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useTranslation } from 'react-i18next';
import { useGetMatchBetsQuery, useGetBettingConfigQuery } from './bettingApi';
import { useGetGroupQuery } from '../groups/groupsApi';
import { formatStage } from '../../utils/formatStage';
import type { MatchDto, BetDto, TeamDto } from '../../types';
import { getTheme } from '../../app/theme';

import { useUserTimeZone } from '../../utils/useUserTimeZone';

interface Props {
  open: boolean;
  matchId: string;
  groupId: string;
  match: MatchDto;
  onClose: () => void;
}

const lightTheme = getTheme('light');

function TeamFlag({ flagUrl, name, code }: { flagUrl: string | null; name: string; code: string }) {
  return (
    <div className="flex flex-col items-center gap-1 sm:gap-1.5">
      {flagUrl ? (
        <img src={flagUrl} alt={name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-white shadow-md" />
      ) : (
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-200 flex items-center justify-center text-[10px] sm:text-xs font-bold text-slate-500 ring-2 ring-white shadow-md">
          {code}
        </div>
      )}
      <span className="text-[11px] sm:text-xs font-semibold text-white/90 max-w-[64px] sm:max-w-[72px] truncate text-center">{name}</span>
    </div>
  );
}

function ProfitDisplay({ profit }: { profit: number }) {
  if (profit === 0) return <span className="text-xs text-green-600 font-bold"><TrendingUpIcon sx={{ fontSize: 14 }} /> 0</span>;
  const isPositive = profit > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
      {isPositive ? <TrendingUpIcon sx={{ fontSize: 14 }} /> : <TrendingDownIcon sx={{ fontSize: 14 }} />}
      {isPositive ? '+' : ''}{profit.toLocaleString()}
    </span>
  );
}

function BetCard({ bet, hideAmount, avatarUrl }: { bet: BetDto; hideAmount?: boolean; avatarUrl?: string | null }) {
  const isSettled = bet.status !== 'Pending' && bet.status !== 'Cancelled';

  return (
    <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-lg bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all">
      {avatarUrl ? (
        <img src={avatarUrl} alt={bet.userDisplayName} className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-slate-200" />
      ) : (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-[11px] font-bold text-white shadow-sm shrink-0">
          {bet.userDisplayName?.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-[13px] text-gray-800 truncate">{bet.userDisplayName}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {!hideAmount && (<span className="text-[11px] sm:text-xs font-bold text-gray-600">{bet.betAmount.toLocaleString()}</span>)}
          {isSettled && <ProfitDisplay profit={bet.profit} />}
        </div>
      </div>
    </div>
  );
}

interface NoBetUser {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
}

function NoBetUserCard({ user }: { user: NoBetUser }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-orange-100">
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt={user.displayName} className="w-7 h-7 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-[11px] font-bold text-orange-500 shrink-0">
          {user.displayName?.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="text-[13px] font-medium text-slate-500 truncate">{user.displayName}</span>
    </div>
  );
}

function ColumnHeader({ team, count, pool, color, border, hideAmount, isWinner }: { team: TeamDto; count: number; pool: number; color: string; border: string; hideAmount?: boolean; isWinner?: boolean }) {
  const { t } = useTranslation();
  return (
    <div className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl border transition-all
      ${isWinner ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-200' : `${color} ${border}`}`}>
      {team.flagUrl ? (
        <img src={team.flagUrl} alt={team.name} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover shadow-sm shrink-0" />
      ) : (
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/60 flex items-center justify-center text-[8px] sm:text-[9px] font-bold text-slate-600 shrink-0">
          {team.code}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] sm:text-xs font-bold truncate ${isWinner ? 'text-amber-800' : 'text-slate-800'}`}>
          {team.name}
        </p>
        {!hideAmount && <p className="text-[9px] sm:text-[10px] text-slate-500">{pool.toLocaleString()} {t('betting.view.wagered')}</p>}
      </div>
      <span> <p> {isWinner && '🏆'}</p></span>
      <span className={`text-base sm:text-lg font-black ${isWinner ? 'text-amber-700' : 'text-slate-700'}`}>{count}</span>
    </div>
  );
}

export function ViewBetsDialog({ open, matchId, groupId, match, onClose }: Props) {
  const { t } = useTranslation();
  const { formatDateLocalized } = useUserTimeZone();
  const isMobile = useMediaQuery('(max-width:480px)');
  const { data: bets, isLoading } = useGetMatchBetsQuery({ groupId, matchId }, { skip: !open });
  const { data: group } = useGetGroupQuery(groupId, { skip: !open || !groupId });
  const { data: config } = useGetBettingConfigQuery({ matchId, groupId }, { skip: !open || !groupId });

  const { stats, homeBets, awayBets, noBetUsers } = useMemo(() => {
    const activeMembers = group?.members.filter((m) => m.isActive) ?? [];
    if (!bets || bets.length === 0) {
      const allNoBet: NoBetUser[] = activeMembers.map((m) => ({ id: m.id, displayName: m.displayName, avatarUrl: m.avatarUrl }));
      return { stats: null, homeBets: [] as BetDto[], awayBets: [] as BetDto[], noBetUsers: allNoBet };
    }
    const home = bets.filter((b) => b.selectedTeamName === match.homeTeam.name);
    const away = bets.filter((b) => b.selectedTeamName === match.awayTeam.name);
    const noPicks = bets.filter((b) => !b.selectedTeamName);
    const totalPool = bets.reduce((s, b) => s + b.betAmount, 0);
    const homePool = home.reduce((s, b) => s + b.betAmount, 0);
    const awayPool = away.reduce((s, b) => s + b.betAmount, 0);

    const betUserIds = new Set(bets.map((b) => b.userId));
    const missingMembers = activeMembers.filter((m) => !betUserIds.has(m.userId));

    const noBet: NoBetUser[] = [
      ...noPicks.map((b) => ({ id: b.id, displayName: b.userDisplayName, avatarUrl: null })),
      ...missingMembers.map((m) => ({ id: m.id, displayName: m.displayName, avatarUrl: m.avatarUrl })),
    ];

    return {
      stats: { totalPool, homePool, awayPool, homePicks: home.length, awayPicks: away.length, total: bets.length },
      homeBets: home,
      awayBets: away,
      noBetUsers: noBet,
    };
  }, [bets, group, match.homeTeam.name, match.awayTeam.name]);

  const hasScore = match.homeScore !== null && match.awayScore !== null;
  const winnerKeepsLoserPaysMode = group?.settlementMode === 'WinnerKeepsLoserPays';

  // Determine winning team for settled matches
  const isSettled = match.status === 'Finished' && hasScore;
  const homeWins = isSettled && match.homeScore! > match.awayScore!;
  const awayWins = isSettled && match.awayScore! > match.homeScore!;

  // Avatar lookup from group members
  const avatarMap = useMemo(() => {
    const map = new Map<string, string | null>();
    group?.members.forEach((m) => map.set(m.userId, m.avatarUrl));
    return map;
  }, [group?.members]);

  return (
    <ThemeProvider theme={lightTheme}>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { borderRadius: isMobile ? 0 : 3, overflow: "hidden" },
        }}
      >
        {/* Match Header */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4">
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: "rgba(255,255,255,0.6)",
              "&:hover": { color: "white" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          <div className="flex items-center justify-center gap-3 sm:gap-5">
            <TeamFlag
              flagUrl={match.homeTeam.flagUrl}
              name={match.homeTeam.name}
              code={match.homeTeam.code}
            />

            <div className="flex flex-col items-center gap-1">
              {hasScore ? (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl font-black text-white">
                      {match.fullHomeScore}
                    </span>
                    <span className="text-base sm:text-lg text-white/40">
                      :
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-white">
                      {match.fullAwayScore}
                    </span>
                  </div>
                  {match.extraHomeScore !== null &&
                    match.extraAwayScore !== null && (
                      <div className="inline-flex items-center text-xs gap-2 px-3 py-2 bg-gray-30">
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

                        <span className="text-amber-600">:</span>
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
              ) : (
                <div className="flex items-center gap-1.5 text-white/50">
                  <span className="text-xs sm:text-sm font-medium">VS</span>
                </div>
              )}
            </div>

            <TeamFlag
              flagUrl={match.awayTeam.flagUrl}
              name={match.awayTeam.name}
              code={match.awayTeam.code}
            />
          </div>

          {/* Match Info Bar */}
          <div className="mt-2 sm:mt-3 flex items-center justify-center gap-1.5 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10">
              <span className="text-[10px] text-white/40 uppercase">
                {t("betting.view.kickoff")}
              </span>
              <span className="text-xs font-semibold text-white/80">
                {formatDateLocalized(match.startTime)}
              </span>
            </div>
            {config && config.handicap !== 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10">
                <span className="text-[10px] text-white/40 uppercase">
                  {t("common.handicap")}
                </span>
                <span className="text-xs font-semibold text-amber-300">
                  {config.favoredTeamName ?? "Home"}{" "}
                  {config.handicap > 0 ? "+" : ""}
                  {config.handicap}
                </span>
              </div>
            )}
            {config && config.handicap === 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10">
                <span className="text-[10px] text-white/40 uppercase">
                  {t("common.handicap")}
                </span>
                <span className="text-xs font-semibold text-white/70">
                  {t("common.even")}
                </span>
              </div>
            )}
            {config && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10">
                <span className="text-[10px] text-white/40 uppercase">
                  {t("betting.view.bet")}
                </span>
                <span className="text-xs font-semibold text-emerald-300">
                  {config.isFixedBet
                    ? `${config.defaultBetAmount?.toLocaleString() ?? config.minBetAmount.toLocaleString()}`
                    : `${config.minBetAmount.toLocaleString()} – ${config.maxBetAmount.toLocaleString()}`}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10">
              <span className="text-[10px] text-white/40 uppercase">
                {t("admin.matches.table.stage")}
              </span>
              <span className="text-[11px] font-semibold text-blue-400 tracking-wider uppercase">
                {formatStage(match.stage)}
                {match.group ? ` · ${formatStage(match.group)}` : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <DialogContent
          sx={{
            p: 0,
            bgcolor: "#f8fafc",
            flex: isMobile ? 1 : undefined,
            overflow: "auto",
          }}
        >
          {isLoading && (
            <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton
                  key={i}
                  variant="rectangular"
                  height={56}
                  sx={{ borderRadius: 3 }}
                />
              ))}
            </div>
          )}

          {!isLoading && (!bets || bets.length === 0) && (
            <div className="p-4 space-y-4">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <SportsSoccerIcon
                  sx={{ fontSize: 40, color: "#cbd5e1", mb: 1 }}
                />
                <p className="text-sm text-slate-400">
                  {t("betting.view.empty.title")}
                </p>
                <p className="text-xs text-slate-300 mt-0.5">
                  {t("betting.view.empty.hint")}
                </p>
              </div>
              {noBetUsers.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-50/60 border border-orange-200/60">
                    <WarningAmberIcon sx={{ fontSize: 16, color: "#f97316" }} />
                    <span className="text-xs font-bold text-orange-600">
                      {t("betting.view.noBet")}
                    </span>
                    <span className="ml-auto text-xs text-orange-400">
                      {noBetUsers.length}{" "}
                      {noBetUsers.length > 1
                        ? t("betting.view.members")
                        : t("betting.view.member")}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {noBetUsers.map((u) => (
                      <NoBetUserCard key={u.id} user={u} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {bets && bets.length > 0 && stats && (
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              {/* Two-column: Home vs Away */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Home column */}
                <div className="space-y-1.5 sm:space-y-2">
                  <ColumnHeader
                    team={match.homeTeam}
                    count={homeBets.length}
                    pool={stats.homePool}
                    color="bg-emerald-50"
                    border="border-emerald-200"
                    isWinner={homeWins}
                  />
                  {homeBets.length > 0 ? (
                    <div className="space-y-1 sm:space-y-1.5">
                      {homeBets.map((bet) => (
                        <BetCard
                          key={bet.id}
                          bet={bet}
                          hideAmount={winnerKeepsLoserPaysMode}
                          avatarUrl={avatarMap.get(bet.userId)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-xs text-slate-400 py-4 sm:py-6">
                      {t("betting.view.noOnePicked")}
                      {match.homeTeam.name}
                    </p>
                  )}
                </div>

                {/* Away column */}
                <div className="space-y-1.5 sm:space-y-2">
                  <ColumnHeader
                    team={match.awayTeam}
                    count={awayBets.length}
                    pool={stats.awayPool}
                    color="bg-green-50"
                    border="border-green-200"
                    isWinner={awayWins}
                  />
                  {awayBets.length > 0 ? (
                    <div className="space-y-1 sm:space-y-1.5">
                      {awayBets.map((bet) => (
                        <BetCard
                          key={bet.id}
                          bet={bet}
                          hideAmount={winnerKeepsLoserPaysMode}
                          avatarUrl={avatarMap.get(bet.userId)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-xs text-slate-400 py-4 sm:py-6">
                      {t("betting.view.noOnePicked")}
                      {match.awayTeam.name}
                    </p>
                  )}
                </div>
              </div>

              {/* No Bet — users who didn't pick or didn't bet at all */}
              {noBetUsers.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-50/60 border border-orange-200/60">
                    <WarningAmberIcon sx={{ fontSize: 16, color: "#f97316" }} />
                    <span className="text-xs font-bold text-orange-600">
                      {t("betting.view.noBet")}
                    </span>
                    <span className="ml-auto text-xs text-orange-400">
                      {noBetUsers.length}{" "}
                      {noBetUsers.length > 1
                        ? t("betting.view.members")
                        : t("betting.view.member")}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {noBetUsers.map((u) => (
                      <NoBetUserCard key={u.id} user={u} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  );
}