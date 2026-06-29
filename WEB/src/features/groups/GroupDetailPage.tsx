import { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Skeleton } from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useGetGroupQuery } from './groupsApi';
import { useGetLeaderboardQuery } from '../leaderboard/leaderboardApi';
import { useGetChampionConfigQuery } from '../predictions/championApi';
import { MemberInfoDialog } from './MemberInfoDialog';
import type { GroupMemberDto } from '../../types';
import { useUserTimeZone } from '../../utils/useUserTimeZone';
import { useTranslation } from 'react-i18next';

const ROLE_STYLE: Record<string, string> = {
  Manager: 'text-blue-700 bg-blue-50 border-blue-200',
  Admin: 'text-purple-700 bg-purple-50 border-purple-200',
  Member: 'text-slate-600 bg-slate-50 border-slate-200',
};

export function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: group, isLoading, error } = useGetGroupQuery(id ?? '', { skip: !id });
  const { data: leaderboard } = useGetLeaderboardQuery({ groupId: id ?? '' }, { skip: !id });
  const { data: championConfig } = useGetChampionConfigQuery({ groupId: id ?? '' }, { skip: !id });
  const [copied, setCopied] = useState(false);
  const [selectedMember, setSelectedMember] = useState<GroupMemberDto | null>(null);
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
  const sortedMembers = [...group.members].sort((a, b) => b.balance - a.balance);

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

      {/* Members capacity bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <PeopleAltIcon sx={{ fontSize: 20, color: "#10b981" }} />
            {t("groups.detail.stats.members")}
          </h2>
          <span className="text-xs font-medium text-slate-500">
            {memberPercent}% {t("groups.detail.capacity")}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              memberPercent >= 90
                ? "bg-red-400"
                : memberPercent >= 60
                  ? "bg-amber-400"
                  : "bg-emerald-400"
            }`}
            style={{ width: `${memberPercent}%` }}
          />
        </div>

        {/* Desktop Header */}
        <div className="hidden md:grid md:grid-cols-12 gap-2 px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-2">
          <div className="col-span-5">{t("groups.detail.member")}</div>
          <div className="col-span-2 text-right">{t("groups.detail.penalty")}</div>
          <div className="col-span-2 text-right">{t("groups.detail.reward")}</div>
          <div className="col-span-1 text-right">{t("groups.detail.netLoss")}</div>
          <div className="col-span-2 text-right">{t("groups.detail.balance")}</div>
        </div>

        {/* Members list */}
        <div className="space-y-2">
          {sortedMembers.map((member, idx) => {
            const netLoss = group.defaultBalance - member.balance;
            return (
              <div
                key={member.userId}
                onClick={() => setSelectedMember(member)}
                className="flex flex-col md:grid md:grid-cols-12 gap-2 px-4 py-3 rounded-xl bg-slate-50 hover:bg-gray-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
              >
                {/* Member Info */}
                <div className="col-span-5 flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-slate-400 text-center">
                    {idx + 1}
                  </span>
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm flex-shrink-0"
                    title={member.email}
                  >
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt=""
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] sm:text-xs font-bold text-white">
                        {member.displayName?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {member.displayName ?? t("common.unknown")}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {t("groups.detail.joined")}{" "}
                      {formatDate(member.joinedAt, "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>

                {/* Mobile Stats Row */}
                <div className="md:hidden flex items-center justify-between pl-8 mt-1">
                  <div className="flex items-center gap-4 text-[11px]">
                    <div className="flex flex-col items-center">
                      <span className="text-slate-400">{t("groups.detail.penalty")}</span>
                      <span className="font-bold text-red-500">-{member.penaltyAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-slate-400">{t("groups.detail.reward")}</span>
                      <span className="font-bold text-emerald-500">+{member.rewardAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-slate-400">{t("groups.detail.netLoss")}</span>
                      <span className={`font-bold ${netLoss > 0 ? 'text-red-500' : netLoss < 0 ? 'text-emerald-500' : 'text-slate-500'}`}>
                        {netLoss > 0 ? '-' : netLoss < 0 ? '+' : ''}{Math.abs(netLoss).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-400">{t("groups.detail.balance")}</span>
                    <span className="text-sm font-bold text-gray-800">{member.balance.toLocaleString()}</span>
                  </div>
                </div>

                {/* Desktop Stats Columns */}
                <div className="hidden md:flex col-span-2 items-center justify-end">
                  <span className="text-sm font-bold text-red-500">
                    -{member.penaltyAmount.toLocaleString()}
                  </span>
                </div>
                <div className="hidden md:flex col-span-2 items-center justify-end">
                  <span className="text-sm font-bold text-emerald-500">
                    +{member.rewardAmount.toLocaleString()}
                  </span>
                </div>
                <div className="hidden md:flex col-span-1 items-center justify-end">
                  <span className={`text-sm font-bold ${netLoss > 0 ? 'text-red-500' : netLoss < 0 ? 'text-emerald-500' : 'text-slate-500'}`}>
                    {netLoss > 0 ? '-' : netLoss < 0 ? '+' : ''}{Math.abs(netLoss).toLocaleString()}
                  </span>
                </div>
                <div className="hidden md:flex col-span-2 items-center justify-end">
                  <span className="text-sm font-bold text-gray-800">
                    {member.balance.toLocaleString()}
                  </span>
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
    </div>
  );
}
