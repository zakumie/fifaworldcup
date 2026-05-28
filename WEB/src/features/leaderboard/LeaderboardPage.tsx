import { useState, useMemo } from 'react';
import { Skeleton } from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  WorkspacePremium as MedalIcon,
  EmojiEventsOutlined as EmojiEventsOutlinedIcon
} from '@mui/icons-material';
import { useGetLeaderboardQuery } from './leaderboardApi';
import { useGroupId } from '../groups/useGroupId';
import { useGetGroupQuery } from '../groups/groupsApi';
import { MemberInfoDialog } from '../groups/MemberInfoDialog';
import { PodiumCard, PODIUM_STYLES } from './PodiumCard';
import { RankingRow } from './RankingRow';
import type { LeaderboardEntryDto, GroupMemberDto } from '../../types';

export function LeaderboardPage() {
  const { groupId, groupsLoading } = useGroupId();
  const { data: leaderboard, isLoading, isError } = useGetLeaderboardQuery(
    { groupId },
    { skip: !groupId },
  );
  const { data: group } = useGetGroupQuery(groupId, { skip: !groupId });
  const [selectedMember, setSelectedMember] = useState<GroupMemberDto | null>(null);
  const [selectedStats, setSelectedStats] = useState<LeaderboardEntryDto | undefined>(undefined);

  const membersMap = useMemo(() => {
    if (!group?.members) return new Map<string, GroupMemberDto>();
    return new Map(group.members.map(m => [m.userId, m]));
  }, [group]);

  const handleMemberClick = (entry: LeaderboardEntryDto) => {
    const member = membersMap.get(entry.userId);
    if (member) {
      setSelectedMember(member);
      setSelectedStats(entry);
    }
  };

  const profitLabel = group?.settlementMode === 'WinnerKeepsLoserPays' ? 'Loss' : 'Profit';

  const top3 = useMemo(() => leaderboard?.slice(0, 3) ?? [], [leaderboard]);

  return (
    <div>
      {/* Dark header */}
      <div className="bg-[#0f1f14] bg-gradient-to-b from-emerald-900 to-emerald-700 rounded-2xl p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 sm:gap-3">
              <EmojiEventsOutlinedIcon sx={{ fontSize: { xs: 26, sm: 32 }, color: 'white' }} />
              <span>LEADER<span className="text-emerald-400">BOARD</span></span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">Top players · Win rates · Rankings</p>
          </div>
          {leaderboard && (
            <div className="text-right hidden sm:block">
              <p className="text-xs text-white font-bold uppercase tracking-wider">Total Players</p>
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
          <p className="text-lg font-semibold text-gray-700">No Group Selected</p>
          <p className="text-sm text-gray-500">Join a group to see the leaderboard</p>
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
          <p className="text-lg font-semibold text-red-600">Failed to load leaderboard</p>
          <p className="text-sm text-gray-500">Please try again later</p>
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
              <h2 className="text-sm font-bold text-emerald-500 uppercase tracking-wide">Full Rankings</h2>
            </div>

            {/* Table header */}
            <div className="hidden sm:flex items-center gap-3 px-5 py-2.5 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
              <span className="w-8 text-center">#</span>
              <span className="flex-1">Player</span>
              <span className="min-w-[120px] text-center">W / D / L</span>
              <span className="min-w-[70px] text-center">Rate</span>
              <span className="min-w-[70px] text-right">Penalty</span>
              <span className="min-w-[70px] text-right">{profitLabel}</span>
              <span className="min-w-[70px] text-right">Balance</span>
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
          <p className="text-lg font-semibold text-gray-700">No rankings yet</p>
          <p className="text-sm text-gray-500">Place bets to appear on the leaderboard</p>
        </div>
      )}

      <MemberInfoDialog
        member={selectedMember}
        stats={selectedStats}
        settlementMode={group?.settlementMode}
        onClose={() => { setSelectedMember(null); setSelectedStats(undefined); }}
      />
    </div>
  );
}
