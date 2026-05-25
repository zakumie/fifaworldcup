import { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Skeleton, Dialog, DialogContent, IconButton, ThemeProvider } from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useGetGroupQuery } from './groupsApi';
import { useGetLeaderboardQuery } from '../leaderboard/leaderboardApi';
import { useGetChampionConfigQuery } from '../predictions/championApi';
import type { GroupMemberDto } from '../../types';
import { useUserTimeZone } from '../../utils/useUserTimeZone';
import { getTheme } from '../../app/theme';

const lightTheme = getTheme('light');

const ROLE_STYLE: Record<string, string> = {
  Manager: 'text-blue-700 bg-blue-50 border-blue-200',
  Admin: 'text-purple-700 bg-purple-50 border-purple-200',
  Member: 'text-slate-600 bg-slate-50 border-slate-200',
};

export function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  const isPredictionExpired = useMemo(
    () => championConfig ? new Date(championConfig.predictionCloseTime) < new Date() : false,
    [championConfig]
  );

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
      ? ((error.data as Record<string, unknown>)?.message as string) || 'Group not found'
      : 'Group not found';
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
              onClick={() => navigate('/groups')}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-emerald-800/50 transition-all flex-shrink-0"
            >
              <ArrowBackIcon sx={{ fontSize: 20 }} />
            </button>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-lg sm:text-xl font-black text-white leading-none">{group.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-black text-white truncate">{group.name}</h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5 truncate">{group.description || 'No description'}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {championConfig?.isEnabled && (
              <button
                onClick={() => navigate(`/groups/${id}/predictions`)}
                disabled={isPredictionExpired}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  isPredictionExpired
                    ? 'bg-yellow-900/30 text-yellow-700/50 border border-yellow-800/30 cursor-not-allowed'
                    : 'bg-gradient-to-r from-yellow-400 to-amber-400 text-yellow-900 shadow-sm shadow-yellow-500/25 hover:shadow-lg hover:shadow-yellow-500/40 hover:from-yellow-300 hover:to-amber-300'
                }`}
              >
                <EmojiEventsIcon sx={{ fontSize: 18 }} />
                <span className="hidden xs:inline">Champion</span> Prediction
              </button>
            )}
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-[#1a2e1f] border border-[#2d4a35] rounded-xl">
              <span className="text-[10px] sm:text-xs text-slate-400">Code:</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-amber-400 tracking-wider">{group.inviteCode}</span>
              <button
                onClick={handleCopy}
                className="px-1.5 sm:px-2 py-1 rounded-lg hover:bg-emerald-800/50 transition-colors"
                title="Copy invite code"
              >
                {copied
                  ? <CheckIcon sx={{ fontSize: 16, color: '#4ade80' }} />
                  : <ContentCopyIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-700 shadow-sm hover:shadow-lg hover:from-emerald-700 hover:to-emerald-600 transition-all duration-200">
          <div className="p-1.5 sm:p-2.5 rounded-lg bg-white/15">
            <PeopleAltIcon sx={{ fontSize: { xs: 18, sm: 24 }, color: 'white' }} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-stone-100 uppercase tracking-wide">Members</p>
            <p className="text-sm sm:text-md font-bold text-white">{group.members.length}<span className="text-xs sm:text-sm text-emerald-300 font-normal ml-1">/{group.maxMembers}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-700 shadow-sm hover:shadow-lg hover:from-emerald-700 hover:to-emerald-600 transition-all duration-200">
          <div className="p-1.5 sm:p-2.5 rounded-lg bg-white/15">
            <AccountBalanceWalletIcon sx={{ fontSize: { xs: 18, sm: 24 }, color: 'white' }} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-stone-100 uppercase tracking-wide">Balance</p>
            <p className="text-sm sm:text-md font-bold text-white truncate">{group.defaultBalance.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-700 shadow-sm hover:shadow-lg hover:from-emerald-700 hover:to-emerald-600 transition-all duration-200">
          <div className="p-1.5 sm:p-2.5 rounded-lg bg-white/15">
            <CalendarTodayIcon sx={{ fontSize: { xs: 18, sm: 24 }, color: 'white' }} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-stone-100 uppercase tracking-wide">Created</p>
            <p className="text-sm sm:text-md font-bold text-white truncate">{formatDate(group.createdAt, 'MMM dd, yyyy')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-700 shadow-sm hover:shadow-lg hover:from-emerald-700 hover:to-emerald-600 transition-all duration-200">
          <div className="p-1.5 sm:p-2.5 rounded-lg bg-white/15">
            <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${group.isActive ? 'bg-emerald-400' : 'bg-gray-400'}`} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-stone-100 uppercase tracking-wide">Status</p>
            <p className={`text-sm sm:text-md font-bold ${group.isActive ? 'text-white' : 'text-emerald-400'}`}>
              {group.isActive ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>
      </div>

      {/* Members capacity bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <PeopleAltIcon sx={{ fontSize: 20, color: '#10b981' }} />
            Members
          </h2>
          <span className="text-xs font-medium text-slate-500">{memberPercent}% capacity</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
          <div className={`h-full rounded-full transition-all duration-500 ${
              memberPercent >= 90 ? 'bg-red-400' : memberPercent >= 60 ? 'bg-amber-400' : 'bg-emerald-400'
            }`}  style={{ width: `${memberPercent}%` }}
          />
        </div>

        {/* Members list */}
        <div className="space-y-2">
          {sortedMembers.map((member, idx) => (
            <div
              key={member.userId}
              onClick={() => setSelectedMember(member)}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 hover:bg-gray-50 border-transparent hover:border-slate-200 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="w-5 text-xs font-bold text-slate-400 text-center">{idx + 1}</span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-white">{member.displayName?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{member.displayName ?? 'Unknown'}</p>
                  <p className="text-[11px] text-slate-400">Joined {formatDate(member.joinedAt, 'MMM dd, yyyy')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${ROLE_STYLE[member.role] ?? ROLE_STYLE.Member}`}>
                  {member.role}
                </span>
                <span className="text-sm font-bold text-gray-800 min-w-[80px] text-right">
                  {member.balance.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Member Info Dialog */}
      <ThemeProvider theme={lightTheme}>
      <Dialog
        open={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        {selectedMember && (() => {
          const stats = leaderboardMap.get(selectedMember.userId);
          return (
            <DialogContent sx={{ p: 0 }}>
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 p-5 relative">
                <IconButton
                  onClick={() => setSelectedMember(null)}
                  sx={{ position: 'absolute', top: 8, right: 8, color: 'white' }}
                  size="small"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shadow-md">
                    {selectedMember.avatarUrl ? (
                      <img src={selectedMember.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-white">{selectedMember.displayName?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{selectedMember.displayName ?? 'Unknown'}</p>
                    <p className="text-xs text-emerald-200">Joined {formatDate(selectedMember.joinedAt, 'MMM dd, yyyy')}</p>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="p-5 grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">Total Bets</p>
                  <p className="text-xl font-bold text-gray-800">{stats?.totalBets ?? 0}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">Win Rate</p>
                  <p className="text-xl font-bold text-emerald-600">{stats ? `${stats.winRate.toFixed(1)}%` : '0%'}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-[11px] font-semibold text-emerald-600 uppercase">Wins</p>
                  <p className="text-xl font-bold text-emerald-700">{stats?.wins ?? 0}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-[11px] font-semibold text-amber-600 uppercase">Draws</p>
                  <p className="text-xl font-bold text-amber-700">{stats?.draws ?? 0}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <p className="text-[11px] font-semibold text-red-500 uppercase">Losses</p>
                  <p className="text-xl font-bold text-red-600">{stats?.losses ?? 0}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">Net Profit</p>
                  <p className={`text-xl font-bold ${(stats?.profit ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {(stats?.profit ?? 0) >= 0 ? '+' : ''}{(stats?.profit ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className={`rounded-xl p-3 text-center ${selectedMember.penaltyAmount > 0 ? 'bg-red-50' : 'bg-slate-50'}`}>
                  <p className={`text-[11px] font-semibold uppercase ${selectedMember.penaltyAmount > 0 ? 'text-red-500' : 'text-slate-500'}`}>Penalty</p>
                  <p className={`text-xl font-bold ${selectedMember.penaltyAmount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                    {selectedMember.penaltyAmount > 0 ? `-${selectedMember.penaltyAmount.toLocaleString()}` : '0'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">Balance</p>
                  <p className="text-xl font-bold text-green-800">{selectedMember.balance.toLocaleString()}</p>
                </div>
                
              </div>
            </DialogContent>
          );
        })()}
      </Dialog>
      </ThemeProvider>
    </div>
  );
}
