import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Skeleton,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import LoginIcon from '@mui/icons-material/Login';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import SearchIcon from '@mui/icons-material/Search';
import { useGetGroupsQuery, useGetAllGroupsQuery } from './groupsApi';
import { JoinGroupDialog } from './JoinGroupDialog';
import type { RootState } from '../../app/store';
import { useUserTimeZone } from '../../utils/useUserTimeZone';

export function GroupListPage() {
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const { formatDate } = useUserTimeZone();
  const isAdmin = currentUser?.role === 'Admin';
  const { data: myGroups, isLoading: myLoading } = useGetGroupsQuery(undefined, { skip: isAdmin });
  const { data: allGroups, isLoading: allLoading } = useGetAllGroupsQuery(undefined, { skip: !isAdmin });
  const data = isAdmin ? allGroups : myGroups;
  const isLoading = isAdmin ? allLoading : myLoading;
  const [joinOpen, setJoinOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filteredData = data?.filter((g) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q);
  });

  const handleCopy = useCallback((e: React.MouseEvent, code: string, groupId: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(groupId);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  return (
    <div>
      {/* Dark header section */}
      <div className="bg-[#0f1f14] bg-gradient-to-r from-emerald-900 to-emerald-700 rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <GroupsIcon sx={{ fontSize: 32, color: 'white' }} />
              <span>MY <span className="text-emerald-400">GROUPS</span></span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">Join groups · Compete with friends · Climb the leaderboard</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setJoinOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white border border-white hover:bg-emerald-600/50 transition-all duration-200 active:scale-95"
            >
              <LoginIcon sx={{ fontSize: 18 }} />
              Join Group
            </button>
          </div>
        </div>
        {/* Search */}
        <div className="relative mt-4">
          <SearchIcon sx={{ fontSize: 20 }} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#1a2e1f] border border-[#2d4a35] rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" height={200} sx={{ borderRadius: 3 }} />
          ))}
        </div>
      )}

      {/* Group cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredData?.map((group) => {
          const memberPercent = Math.round((group.memberCount / group.maxMembers) * 100);
          return (
            <div
              key={group.id}
              onClick={() => navigate(`/groups/${group.id}`)}
              className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
            >
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm">
                      <span className="text-lg font-black text-white leading-none">{group.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-800 leading-tight">{group.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Created {formatDate(group.createdAt, 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${group.isActive ? 'text-emerald-700 bg-emerald-50' : 'text-gray-500 bg-gray-100'}`}>
                    {group.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[40px]">
                  {group.description || 'No description'}
                </p>

                {/* Members progress bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <PeopleAltIcon sx={{ fontSize: 14 }} />
                      Members
                    </span>
                    <span className="text-xs font-bold text-gray-700">{group.memberCount}/{group.maxMembers}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        memberPercent >= 90 ? 'bg-red-400' : memberPercent >= 60 ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${memberPercent}%` }}
                    />
                  </div>
                </div>

                {/* Balance info */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 mb-3">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <AccountBalanceWalletIcon sx={{ fontSize: 14 }} />
                    Default Balance
                  </span>
                  <span className="text-xs font-bold text-emerald-600">
                    $ {group.defaultBalance.toLocaleString()}
                  </span>
                </div>

                {/* Invite code */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-50 border border-amber-100">
                  <span className="text-xs font-bold uppercase text-gray-400 truncate px-2">Invite Code</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold text-amber-700 tracking-wider">{group.inviteCode}</span>
                    <button
                      onClick={(e) => handleCopy(e, group.inviteCode, group.id)}
                      className="p-0.5 rounded hover:bg-amber-200/50 transition-colors"
                      title="Copy invite code"
                    >
                      {copiedId === group.id
                        ? <CheckIcon sx={{ fontSize: 14, color: '#16a34a' }} />
                        : <ContentCopyIcon sx={{ fontSize: 14, color: '#b45309' }} />
                      }
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {!isLoading && (!filteredData || filteredData.length === 0) && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <GroupsIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
          <p className="text-lg font-medium">{search ? 'No groups found' : 'No groups yet'}</p>
          <p className="text-sm">{search ? 'Try a different search term' : 'Join an existing group or ask an admin to create one'}</p>
        </div>
      )}

      {/* Join Group Dialog */}
      <JoinGroupDialog
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
      />
    </div>
  );
}
