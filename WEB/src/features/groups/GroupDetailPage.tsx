import { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Skeleton, IconButton } from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import EditIcon from '@mui/icons-material/Edit';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import { useGetGroupQuery } from './groupsApi';
import { useGetLeaderboardQuery } from '../leaderboard/leaderboardApi';
import { useGetChampionConfigQuery } from '../predictions/championApi';
import { MemberInfoDialog } from './MemberInfoDialog';
import { EditMemberAmountsDialog } from './EditMemberAmountsDialog';
import type { GroupMemberDto } from '../../types';
import type { RootState } from '../../app/store';
import { useUserTimeZone } from '../../utils/useUserTimeZone';
import { useTranslation } from 'react-i18next';

export function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isAdmin = currentUser?.role === 'Admin';
  const { data: group, isLoading, error } = useGetGroupQuery(id ?? '', { skip: !id });
  const { data: leaderboard } = useGetLeaderboardQuery({ groupId: id ?? '' }, { skip: !id });
  const { data: championConfig } = useGetChampionConfigQuery({ groupId: id ?? '' }, { skip: !id });
  const [copied, setCopied] = useState(false);
  const [selectedMember, setSelectedMember] = useState<GroupMemberDto | null>(null);
  const [editMember, setEditMember] = useState<GroupMemberDto | null>(null);
  const { formatDate } = useUserTimeZone();

  const leaderboardMap = useMemo(() => {
    if (!leaderboard) return new Map();
    return new Map(leaderboard.map(e => [e.userId, e]));
  }, [leaderboard]);

  const isPredictionExpired = false;

  const handleCopy = useCallback(() => {
    if (!group) return;
    navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [group]);

  if (isLoading) {
    return (
      <div>
        <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 3, mb: 3 }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
      </div>
    );
  }

  if (!group) {
    const errorMessage = error && typeof error === 'object' && 'data' in error 
      ? ((error.data as Record<string, unknown>)?.message as string) || t('groups.detail.notFound')
      : t('groups.detail.notFound');
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <GroupsIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
        <p className="text-lg font-medium">{errorMessage}</p>
      </div>
    );
  }

  const memberPercent = Math.round((group.members.length / group.maxMembers) * 100);
  const sortedMembers = [...group.members].sort((a, b) => {
    const balanceA = a.balance - a.rewardAmount + a.penaltyAmount;
    const balanceB = b.balance - b.rewardAmount + b.penaltyAmount;
    return balanceB - balanceA;
  });

  return (
    <div>
      {/* Header */}
      <div className="bg-[#0f1f14] bg-gradient-to-r from-emerald-900 to-emerald-700 rounded-2xl p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={() => navigate("/groups")}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-emerald-800/50 transition-all flex-shrink-0"
            >
              <ArrowBackIcon sx={{ fontSize: 20 }} />
            </button>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-lg sm:text-xl font-black text-white leading-none">
                {group.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-black text-white truncate">
                {group.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5 truncate">
                {group.description || t("common.noDescription")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {championConfig?.isEnabled && (
              <button
                onClick={() => navigate(`/groups/${id}/predictions`)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 py-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  isPredictionExpired
                    ? "bg-yellow-900/30 text-yellow-700/50 border border-yellow-800/30 cursor-not-allowed"
                    : "bg-gradient-to-r from-yellow-400 to-amber-400 text-yellow-900 shadow-sm shadow-yellow-500/25 hover:shadow-lg hover:shadow-yellow-500/40 hover:from-yellow-300 hover:to-amber-300"
                }`}
              >
                <EmojiEventsIcon sx={{ fontSize: 18 }} />
                <span className="hidden xs:inline">
                  {t("groups.detail.championPrediction")}
                </span>{" "}
                {t("groups.detail.prediction")}
              </button>
            )}
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-[#1a2e1f] border border-[#2d4a35] rounded-xl">
              <span className="text-[10px] sm:text-xs text-slate-400">
                {t("groups.detail.code")}
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-amber-400 tracking-wider">
                {group.inviteCode}
              </span>
              <button
                onClick={handleCopy}
                className="px-1.5 sm:px-2 py-1 rounded-lg hover:bg-emerald-800/50 transition-colors"
                title={t("groups.detail.copyCode")}
              >
                {copied ? (
                  <CheckIcon sx={{ fontSize: 16, color: "#4ade80" }} />
                ) : (
                  <ContentCopyIcon sx={{ fontSize: 16, color: "#94a3b8" }} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-700 shadow-sm hover:shadow-lg hover:from-emerald-700 hover:to-emerald-600 transition-all duration-200">
          <div className="p-1.5 sm:p-2.5 rounded-lg bg-white/15">
            <PeopleAltIcon
              sx={{ fontSize: { xs: 18, sm: 24 }, color: "white" }}
            />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-stone-100 uppercase tracking-wide">
              {t("groups.detail.stats.members")}
            </p>
            <p className="text-sm sm:text-md font-bold text-white">
              {group.members.length}
              <span className="text-xs sm:text-sm text-emerald-300 font-normal ml-1">
                /{group.maxMembers}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-700 shadow-sm hover:shadow-lg hover:from-emerald-700 hover:to-emerald-600 transition-all duration-200">
          <div className="p-1.5 sm:p-2.5 rounded-lg bg-white/15">
            <AccountBalanceWalletIcon
              sx={{ fontSize: { xs: 18, sm: 24 }, color: "white" }}
            />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-stone-100 uppercase tracking-wide">
              {t("groups.detail.stats.point")}
            </p>
            <p className="text-sm sm:text-md font-bold text-white truncate">
              {group.fundAmount.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-700 shadow-sm hover:shadow-lg hover:from-emerald-700 hover:to-emerald-600 transition-all duration-200">
          <div className="p-1.5 sm:p-2.5 rounded-lg bg-white/15">
            <CalendarTodayIcon
              sx={{ fontSize: { xs: 18, sm: 24 }, color: "white" }}
            />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-stone-100 uppercase tracking-wide">
              {t("groups.detail.stats.created")}
            </p>
            <p className="text-sm sm:text-md font-bold text-white truncate">
              {formatDate(group.createdAt, "MMM dd, yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-700 shadow-sm hover:shadow-lg hover:from-emerald-700 hover:to-emerald-600 transition-all duration-200">
          <div className="p-1.5 sm:p-2.5 rounded-lg bg-white/15">
            <div
              className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${group.isActive ? "bg-emerald-400" : "bg-gray-400"}`}
            />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-stone-100 uppercase tracking-wide">
              {t("groups.detail.stats.status")}
            </p>
            <p
              className={`text-sm sm:text-md font-bold ${group.isActive ? "text-white" : "text-emerald-400"}`}
            >
              {group.isActive ? t("common.active") : t("common.inactive")}
            </p>
          </div>
        </div>
      </div>

      {/* Members section */}
      <div className="bg-white rounded-2xl border border-emerald-900/40 shadow-lg overflow-hidden mb-6">
        {/* Section header */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PeopleAltIcon sx={{ fontSize: 20, color: "#34d399" }} />
              {t("groups.detail.stats.members")}
              <span className="text-xs font-medium text-slate-500 ml-1">({group.members.length}/{group.maxMembers})</span>
            </h2>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
              memberPercent >= 90 ? 'bg-red-500/15 text-red-400' : memberPercent >= 60 ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'
            }`}>
              {memberPercent}% {t("groups.detail.capacity")}
            </span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                memberPercent >= 90 ? "bg-gradient-to-r from-red-500 to-red-400"
                  : memberPercent >= 60 ? "bg-gradient-to-r from-amber-500 to-amber-400"
                  : "bg-gradient-to-r from-emerald-500 to-emerald-400"
              }`}
              style={{ width: `${memberPercent}%` }}
            />
          </div>
        </div>

        {/* Desktop table header */}
        <div className="hidden md:grid md:grid-cols-12 gap-3 px-5 py-2.5 bg-white/[0.03] border-y border-white/[0.06] text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-3">{t("groups.detail.member")}</div>
          <div className="col-span-2 text-right">{t("groups.detail.penalty")}</div>
          <div className="col-span-2 text-right">{t("groups.detail.reward")}</div>
          <div className="col-span-2 text-right">{t("groups.detail.netLoss")}</div>
          <div className={`${isAdmin ? 'col-span-1' : 'col-span-2'} text-right`}>{t("groups.detail.balance")}</div>
          {isAdmin && <div className="col-span-1 text-center">{t("common.actions")}</div>}
        </div>

        {/* Members list */}
        <div className="divide-y divide-white/[0.04]">
          {sortedMembers.map((member, idx) => {
            const balanceAmount = member.balance - member.rewardAmount + member.penaltyAmount;
            const netLoss = group.defaultBalance - balanceAmount - member.penaltyAmount + member.rewardAmount;
            const isTop3 = idx < 3;
            const isCurrentUser = member.userId === currentUser?.id;
            const stats = leaderboardMap.get(member.userId);

            const rankBg = idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-amber-500/20'
              : idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 shadow-slate-400/20'
              : idx === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 shadow-amber-600/20'
              : 'bg-white/[0.06]';

            const rankText = isTop3 ? 'text-white font-black' : 'text-slate-500 font-bold';

            return (
              <div
                key={member.userId}
                onClick={() => setSelectedMember(member)}
                className={`
                  group/row relative cursor-pointer transition-all duration-200
                  hover:bg-white/[0.04]
                  ${isCurrentUser ? 'bg-emerald-500/[0.06]' : ''}
                  ${isTop3 ? 'bg-amber-500/[0.03]' : ''}
                `}
              >
                {/* Current user indicator */}
                {isCurrentUser && (
                  <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-emerald-400" />
                )}

                {/* Mobile card layout */}
                <div className="md:hidden px-4 py-3">
                  <div className="flex items-center gap-3">
                    {/* Rank badge */}
                    <div className={`w-7 h-7 rounded-lg ${rankBg} flex items-center justify-center shadow-sm flex-shrink-0`}>
                      {idx === 0 ? <span className="text-[11px]">1</span>
                        : idx === 1 ? <span className="text-[11px]">2</span>
                        : idx === 2 ? <span className="text-[11px]">3</span>
                        : <span className={`text-[11px] ${rankText}`}>{idx + 1}</span>
                      }
                    </div>

                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm ${
                          isTop3 ? 'ring-2 ring-amber-400/40' : ''
                        } ${!member.avatarUrl ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' : ''}`}
                        title={member.email}
                      >
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-white">{member.displayName?.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                    </div>

                    {/* Name + balance */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold truncate">
                          {member.displayName ?? t("common.unknown")}
                        </p>
                        {isCurrentUser && (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded-full">{t('common.you') || 'YOU'}</span>
                        )}
                      </div>
                      {stats && (
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-emerald-400 font-medium">{stats.wins}W</span>
                          <span className="text-[10px] text-red-400 font-medium">{stats.losses}L</span>
                          {stats.winRate > 0 && (
                            <span className="text-[10px] text-slate-500">{Math.round(stats.winRate)}%</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Balance column - mobile */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-black text-white">{balanceAmount.toLocaleString()}</p>
                      <div className="flex items-center justify-end gap-0.5">
                        {netLoss > 0 ? (
                          <TrendingDownIcon sx={{ fontSize: 12, color: '#f87171' }} />
                        ) : netLoss < 0 ? (
                          <TrendingUpIcon sx={{ fontSize: 12, color: '#34d399' }} />
                        ) : (
                          <TrendingFlatIcon sx={{ fontSize: 12, color: '#64748b' }} />
                        )}
                        <span className={`text-[10px] font-bold ${netLoss > 0 ? 'text-red-400' : netLoss < 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {netLoss > 0 ? '-' : netLoss < 0 ? '+' : ''}{Math.abs(netLoss).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile expanded stats */}
                  <div className="flex items-center justify-between mt-2 ml-[76px] mr-1">
                    <div className="flex items-center gap-3 text-[10px]">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400/70" />
                        <span className="text-slate-500">{t("groups.detail.penalty")}</span>
                        <span className="font-bold text-red-400">-{member.penaltyAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70" />
                        <span className="text-slate-500">{t("groups.detail.reward")}</span>
                        <span className="font-bold text-emerald-400">+{member.rewardAmount.toLocaleString()}</span>
                      </div>
                    </div>
                    {isAdmin && (
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); setEditMember(member); }}
                        sx={{ p: 0.5, color: '#34d399', '&:hover': { bgcolor: 'rgba(52,211,153,0.1)' } }}
                      >
                        <EditIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    )}
                  </div>
                </div>

                {/* Desktop table row */}
                <div className="hidden md:grid md:grid-cols-12 gap-3 px-5 py-3 items-center">
                  {/* Rank */}
                  <div className="col-span-1 flex justify-center">
                    <div className={`w-8 h-8 rounded-lg ${rankBg} flex items-center justify-center shadow-sm`}>
                      {idx === 0 ? <span className="text-xs">1</span>
                        : idx === 1 ? <span className="text-xs">2</span>
                        : idx === 2 ? <span className="text-xs">3</span>
                        : <span className={`text-xs ${rankText}`}>{idx + 1}</span>
                      }
                    </div>
                  </div>

                  {/* Member info */}
                  <div className="col-span-3 flex items-center gap-3 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm ${
                          isTop3 ? 'ring-2 ring-amber-400/40' : ''
                        } ${!member.avatarUrl ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' : ''}`}
                        title={member.email}
                      >
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-white">{member.displayName?.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold truncate">
                          {member.displayName ?? t("common.unknown")}
                        </p>
                        {isCurrentUser && (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded-full">{t('common.you') || 'YOU'}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-500">{t("groups.detail.joined")} {formatDate(member.joinedAt, "MMM dd")}</span>
                        {stats && (
                          <>
                            <span className="text-[10px] text-slate-600">·</span>
                            <span className="text-[10px] text-emerald-400 font-medium">{stats.wins}W</span>
                            <span className="text-[10px] text-red-400 font-medium">{stats.losses}L</span>
                            {stats.winRate > 0 && (
                              <span className="text-[10px] text-slate-500">({Math.round(stats.winRate)}%)</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Penalty */}
                  <div className="col-span-2 flex items-center justify-end">
                    {member.penaltyAmount > 0 ? (
                      <span className="text-sm font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg">
                        -{member.penaltyAmount.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-700">—</span>
                    )}
                  </div>

                  {/* Reward */}
                  <div className="col-span-2 flex items-center justify-end">
                    {member.rewardAmount > 0 ? (
                      <span className="text-sm font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                        +{member.rewardAmount.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-700">—</span>
                    )}
                  </div>

                  {/* Net */}
                  <div className="col-span-2 flex items-center justify-end gap-1">
                    {netLoss > 0 ? (
                      <TrendingDownIcon sx={{ fontSize: 14, color: '#f87171' }} />
                    ) : netLoss < 0 ? (
                      <TrendingUpIcon sx={{ fontSize: 14, color: '#34d399' }} />
                    ) : (
                      <TrendingFlatIcon sx={{ fontSize: 14, color: '#64748b' }} />
                    )}
                    <span className={`text-sm font-bold ${netLoss > 0 ? 'text-red-400' : netLoss < 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                      {netLoss > 0 ? '-' : netLoss < 0 ? '+' : ''}{Math.abs(netLoss).toLocaleString()}
                    </span>
                  </div>

                  {/* Balance */}
                  <div className={`${isAdmin ? 'col-span-1' : 'col-span-2'} flex items-center justify-end`}>
                    <span className="text-sm font-black">
                      {balanceAmount.toLocaleString()}
                    </span>
                  </div>

                  {/* Action */}
                  {isAdmin && (
                    <div className="col-span-1 flex items-center justify-center">
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); setEditMember(member); }}
                        title={t('common.edit')}
                        className="opacity-0 group-hover/row:opacity-100 transition-opacity"
                        sx={{ color: '#34d399', '&:hover': { bgcolor: 'rgba(52,211,153,0.1)' } }}
                      >
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Member Info Dialog */}
      <MemberInfoDialog
        member={selectedMember}
        stats={
          selectedMember ? leaderboardMap.get(selectedMember.userId) : undefined
        }
        settlementMode={group.settlementMode}
        onClose={() => setSelectedMember(null)}
      />

      {/* Edit Member Amounts Dialog */}
      {isAdmin && (
        <EditMemberAmountsDialog
          open={!!editMember}
          groupId={group.id}
          member={editMember}
          onClose={() => setEditMember(null)}
        />
      )}
    </div>
  );
}
