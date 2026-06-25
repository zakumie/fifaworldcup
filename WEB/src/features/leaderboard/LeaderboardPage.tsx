import { useState, useMemo, useEffect } from 'react';
import { Skeleton } from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  WorkspacePremium as MedalIcon,
  EmojiEventsOutlined as EmojiEventsOutlinedIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useGetLeaderboardQuery } from './leaderboardApi';
import { useGroupId } from '../groups/useGroupId';
import { useGetGroupQuery } from '../groups/groupsApi';
import { MemberInfoDialog } from '../groups/MemberInfoDialog';
import { PoliceAlertWarning } from './PoliceAlertWarning';
import { PodiumCard, PODIUM_STYLES } from './PodiumCard';
import { RankingRow } from './RankingRow';
import type { LeaderboardEntryDto, GroupMemberDto } from '../../types';

export function LeaderboardPage() {
  const { t } = useTranslation();
  const { groupId, groupsLoading } = useGroupId();
  const { data: leaderboard, isLoading, isError } = useGetLeaderboardQuery(
    { groupId },
    { skip: !groupId },
  );
  const { data: group } = useGetGroupQuery(groupId, { skip: !groupId });
  const [selectedMember, setSelectedMember] = useState<GroupMemberDto | null>(null);
  const [selectedStats, setSelectedStats] = useState<LeaderboardEntryDto | undefined>(undefined);
  const [showWarning, setShowWarning] = useState(false);
  const [pendingMemberInfo, setPendingMemberInfo] = useState<{
    member: GroupMemberDto;
    stats: LeaderboardEntryDto;
  } | null>(null);

  const STORAGE_KEY = 'leaderboard_warning_shown';

  const membersMap = useMemo(() => {
    if (!group?.members) return new Map<string, GroupMemberDto>();
    return new Map(group.members.map(m => [m.userId, m]));
  }, [group]);

  useEffect(() => {
    // Check if warning has been shown before
    const warningShown = localStorage.getItem(STORAGE_KEY);
    if (!warningShown) {
      // First time, don't mark as shown yet - only mark when user clicks podium
    }

    // Cleanup: Remove storage key when leaving the page
    return () => {
      localStorage.removeItem(STORAGE_KEY);
    };
  }, []);

  const handleMemberClick = (entry: LeaderboardEntryDto) => {
    const member = membersMap.get(entry.userId);
    if (!member) return;

    // Check if this is a top 3 podium click and warning hasn't been shown
    const warningShown = localStorage.getItem(STORAGE_KEY);
    const isTop3 = entry.rank <= 3;

    if (isTop3 && !warningShown) {
      // First time clicking top 3 - show warning
      setPendingMemberInfo({ member, stats: entry });
      setShowWarning(true);
    } else {
      // Either not top 3, or warning already shown - show member info directly
      setSelectedMember(member);
      setSelectedStats(entry);
    }
  };

  const handleWarningAccept = () => {
    // Mark warning as shown
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowWarning(false);

    // Show the member info that was pending
    if (pendingMemberInfo) {
      setSelectedMember(pendingMemberInfo.member);
      setSelectedStats(pendingMemberInfo.stats);
      setPendingMemberInfo(null);
    }
  };

  const handleWarningClose = () => {
    // User closed warning without accepting - mark as shown anyway
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowWarning(false);
    setPendingMemberInfo(null);
  };

  const profitLabel = group?.settlementMode === 'WinnerKeepsLoserPays' ? t('leaderboard.table.loss') : t('leaderboard.table.profit');

  const top3 = useMemo(() => leaderboard?.slice(0, 3) ?? [], [leaderboard]);

  return (
    <div>
      {/* Dark header */}
      <div className="bg-[#0f1f14] bg-gradient-to-b from-emerald-900 to-emerald-700 rounded-2xl p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 sm:gap-3">
              <EmojiEventsOutlinedIcon sx={{ fontSize: { xs: 26, sm: 32 }, color: 'white' }} />
              <span>{t('leaderboard.title')}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">{t('leaderboard.subtitle')}</p>
          </div>
          {leaderboard && (
            <div className="text-right hidden sm:block">
              <p className="text-xs text-white font-bold uppercase tracking-wider">{t('leaderboard.totalPlayers')}</p>
              <p className="text-lg font-bold text-white">{leaderboard.length}</p>
            </div>
          )}
        </div>
      </div>

      {/* No Group */}
      {!groupId && !groupsLoading && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
            <TrophyIcon sx={{ fontSize: 32, color: '#d97706' }} />
          </div>
          <p className="text-lg font-semibold text-gray-700">{t('leaderboard.noGroup.title')}</p>
          <p className="text-sm text-gray-500">{t('leaderboard.noGroup.hint')}</p>
        </div>
      )}

      {/* Loading */}
      {(isLoading || groupsLoading) && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" height={200} sx={{ borderRadius: 3 }} />
            ))}
          </div>
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-lg font-semibold text-red-600">{t('leaderboard.error.loadFailed')}</p>
          <p className="text-sm text-gray-500">{t('common.tryAgainLater')}</p>
        </div>
      )}

      {leaderboard && leaderboard.length > 0 && (
        <div className="space-y-6">
          {/* Top 3 Podium */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[top3[1], top3[0], top3[2]].map((entry, i) => {
                if (!entry) return <div key={i} />;
                return (
                  <div key={entry.userId} className={`${i === 1 ? 'sm:-mt-2' : 'sm:mt-2'} cursor-pointer`} onClick={() => handleMemberClick(entry)}>
                    <PodiumCard entry={entry} style={PODIUM_STYLES[entry.rank - 1]} profitLabel={profitLabel} />
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Rankings */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <MedalIcon sx={{ fontSize: 20, color: '#10b981' }} />
              <h2 className="text-sm font-bold text-emerald-500 uppercase tracking-wide">{t('leaderboard.fullRankings')}</h2>
            </div>

            {/* Table header */}
            <div className="hidden sm:flex items-center gap-3 px-5 py-2.5 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
              <span className="w-8 text-center">{t('leaderboard.table.rank')}</span>
              <span className="flex-1">{t('leaderboard.table.player')}</span>
              <span className="min-w-[100px] text-center">{t('leaderboard.table.wdl')}</span>
              <span className="min-w-[56px] text-center">{t('leaderboard.table.rate')}</span>
              <span className="min-w-[60px] text-right">{t('leaderboard.table.penalty')}</span>
              <span className="min-w-[65px] text-right">{profitLabel}</span>
              <span className="min-w-[70px] text-right">{t('leaderboard.table.balance')}</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-50">
              {leaderboard.map((entry) => (
                <RankingRow key={entry.userId} entry={entry} onClick={() => handleMemberClick(entry)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {leaderboard && leaderboard.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
          <TrophyIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
          <p className="text-lg font-semibold text-gray-700">{t('leaderboard.empty.title')}</p>
          <p className="text-sm text-gray-500">{t('leaderboard.empty.hint')}</p>
        </div>
      )}

      <PoliceAlertWarning
        open={showWarning}
        onClose={handleWarningClose}
        onAccept={handleWarningAccept}
      />

      <MemberInfoDialog
        member={selectedMember}
        stats={selectedStats}
        settlementMode={group?.settlementMode}
        onClose={() => { setSelectedMember(null); setSelectedStats(undefined); }}
      />
    </div>
  );
}
