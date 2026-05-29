import { Dialog, DialogContent, IconButton, ThemeProvider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import type { GroupMemberDto, LeaderboardEntryDto, SettlementMode } from '../../types';
import { useUserTimeZone } from '../../utils/useUserTimeZone';
import { getTheme } from '../../app/theme';

const lightTheme = getTheme('light');

export interface MemberInfoDialogProps {
  member: GroupMemberDto | null;
  stats: LeaderboardEntryDto | undefined;
  settlementMode?: SettlementMode;
  onClose: () => void;
}

export function MemberInfoDialog({ member, stats, settlementMode, onClose }: MemberInfoDialogProps) {
  const { t } = useTranslation();
  const { formatDate } = useUserTimeZone();
  const profitLabel = settlementMode === 'WinnerKeepsLoserPays' ? t('members.stats.netLoss') : t('members.stats.netProfit');

  return (
    <ThemeProvider theme={lightTheme}>
      <Dialog
        open={!!member}
        onClose={onClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        {member && (
          <DialogContent sx={{ p: 0 }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 p-5 relative">
              <IconButton
                onClick={onClose}
                sx={{ position: 'absolute', top: 8, right: 8, color: 'white' }}
                size="small"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center shadow-md">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-white">{member.displayName?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{member.displayName ?? 'Unknown'}</p>
                  <p className="text-xs text-emerald-200">{t('members.joined')}{formatDate(member.joinedAt, 'MMM dd, yyyy')}</p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="p-5 grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-[11px] font-semibold text-slate-500 uppercase">{t('members.stats.totalBets')}</p>
                <p className="text-xl font-bold text-gray-800">{stats?.totalBets ?? 0}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-[11px] font-semibold text-slate-500 uppercase">{t('members.stats.winRate')}</p>
                <p className="text-xl font-bold text-emerald-600">{stats ? `${stats.winRate.toFixed(1)}%` : '0%'}</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <p className="text-[11px] font-semibold text-emerald-600 uppercase">{t('members.stats.wins')}</p>
                <p className="text-xl font-bold text-emerald-700">{stats?.wins ?? 0}</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-center">
                <p className="text-[11px] font-semibold text-amber-600 uppercase">{t('members.stats.draws')}</p>
                <p className="text-xl font-bold text-amber-700">{stats?.draws ?? 0}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <p className="text-[11px] font-semibold text-red-500 uppercase">{t('members.stats.losses')}</p>
                <p className="text-xl font-bold text-red-600">{stats?.losses ?? 0}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-[11px] font-semibold text-slate-500 uppercase">{profitLabel}</p>
                <p className={`text-xl font-bold ${(stats?.profit ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {(stats?.profit ?? 0) > 0 ? '+' : ''}{(stats?.profit ?? 0).toLocaleString()}
                </p>
              </div>
              <div className={`rounded-xl p-3 text-center ${member.penaltyAmount > 0 ? 'bg-red-50' : 'bg-slate-50'}`}>
                <p className={`text-[11px] font-semibold uppercase ${member.penaltyAmount > 0 ? 'text-red-500' : 'text-slate-500'}`}>{t('members.stats.penalty')}</p>
                <p className={`text-xl font-bold ${member.penaltyAmount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                  {member.penaltyAmount > 0 ? `-${member.penaltyAmount.toLocaleString()}` : '0'}
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-[11px] font-semibold text-slate-500 uppercase">{t('members.stats.balance')}</p>
                <p className="text-xl font-bold text-green-800">{member.balance.toLocaleString()}</p>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </ThemeProvider>
  );
}
