import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, TextField, Alert, Button,
  IconButton, ThemeProvider, InputAdornment,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { useUpdateMemberAmountsMutation } from './groupsApi';
import type { UpdateMemberAmountsRequest, GroupMemberDto } from '../../types';
import { getTheme } from '../../app/theme';

const lightTheme = getTheme('light');

const schema = yup.object({
  penaltyAmount: yup.number().min(0, 'Penalty amount cannot be negative').required('Penalty amount is required'),
  rewardAmount: yup.number().min(0, 'Reward amount cannot be negative').required('Reward amount is required'),
});

interface Props {
  open: boolean;
  groupId: string;
  member: GroupMemberDto | null;
  onClose: () => void;
}

export function EditMemberAmountsDialog({ open, groupId, member, onClose }: Props) {
  const { t } = useTranslation();
  const [updateAmounts, { isLoading }] = useUpdateMemberAmountsMutation();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<UpdateMemberAmountsRequest>({
    resolver: yupResolver(schema),
  });

  const penaltyValue = useWatch({ control, name: 'penaltyAmount' }) ?? 0;
  const rewardValue = useWatch({ control, name: 'rewardAmount' }) ?? 0;

  useEffect(() => {
    if (member && open) {
      reset({
        penaltyAmount: member.penaltyAmount,
        rewardAmount: member.rewardAmount,
      });
      setError('');
      setSuccess('');
    }
  }, [member, open, reset]);

  const onSubmit = async (data: UpdateMemberAmountsRequest) => {
    if (!member) return;
    setError('');
    setSuccess('');

    try {
      await updateAmounts({
        groupId,
        memberId: member.userId,
        body: data,
      }).unwrap();
      setSuccess(t('groups.detail.editAmounts.success'));
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'data' in err
        ? String((err.data as Record<string, unknown>)?.message || t('common.unknown'))
        : t('common.unknown');
      setError(message);
    }
  };

  if (!member) return null;

  const netChange = rewardValue - penaltyValue;

  return (
    <ThemeProvider theme={lightTheme}>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        <DialogContent sx={{ p: 0 }}>
          {/* Header */}
          <div className="bg-gradient-to-br from-[#0f1a13] via-emerald-900 to-emerald-800 p-5 relative">
            <IconButton
              onClick={onClose}
              sx={{
                position: 'absolute', right: 8, top: 8, color: 'rgba(255,255,255,0.6)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', color: 'white' },
              }}
              size="small"
            >
              <CloseIcon fontSize="small" />
            </IconButton>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 ring-2 ring-emerald-400/30">
                {member.avatarUrl ? (
                  <img src={member.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <span className="text-base font-bold text-white">{member.displayName?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-white truncate">{member.displayName}</h2>
                <p className="text-xs text-emerald-300/70">{member.email}</p>
              </div>
            </div>

            {/* Current balance summary */}
            <div className="flex items-center gap-3 mt-4">
              <div className="flex-1 rounded-xl bg-white/[0.06] border border-white/[0.08] px-3 py-2 text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{t('groups.detail.balance')}</p>
                <p className="text-lg font-black text-white mt-0.5">{member.balance.toLocaleString()}</p>
              </div>
              <div className="flex-1 rounded-xl bg-red-500/[0.08] border border-red-500/[0.12] px-3 py-2 text-center">
                <p className="text-[10px] text-red-400/80 uppercase tracking-wider font-medium">{t('groups.detail.penalty')}</p>
                <p className="text-lg font-black text-red-400 mt-0.5">-{member.penaltyAmount.toLocaleString()}</p>
              </div>
              <div className="flex-1 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/[0.12] px-3 py-2 text-center">
                <p className="text-[10px] text-emerald-400/80 uppercase tracking-wider font-medium">{t('groups.detail.reward')}</p>
                <p className="text-lg font-black text-emerald-400 mt-0.5">+{member.rewardAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-5">
            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert
                severity="success"
                icon={<CheckCircleIcon sx={{ fontSize: 20 }} />}
                sx={{ mb: 2, borderRadius: 2 }}
              >
                {success}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <TextField 
                label={t('groups.detail.penalty')}
                type="number"
                fullWidth
                {...register('penaltyAmount')}
                error={!!errors.penaltyAmount}
                helperText={errors.penaltyAmount?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <RemoveCircleOutlineIcon sx={{ fontSize: 18, color: '#f87171' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    marginBottom: 2,
                    fontSize: '0.875rem',
                    backgroundColor: '#fef2f2',
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#fca5a5' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#ef4444', borderWidth: 2 },
                  },
                  '& .MuiInputLabel-root': { fontSize: '0.8rem', fontWeight: 500 },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#ef4444' },
                }}
                inputProps={{ step: '10', min: '0' }}
              />

              <TextField
                label={t('groups.detail.reward')}
                type="number"
                fullWidth
                {...register('rewardAmount')}
                error={!!errors.rewardAmount}
                helperText={errors.rewardAmount?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CardGiftcardIcon sx={{ fontSize: 18, color: '#34d399' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    marginBottom: 2,
                    fontSize: '0.875rem',
                    backgroundColor: '#ecfdf5',
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6ee7b7' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#10b981', borderWidth: 2 },
                  },
                  '& .MuiInputLabel-root': { fontSize: '0.8rem', fontWeight: 500 },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#10b981' },
                }}
                inputProps={{ step: '10', min: '0' }}
              />

              {/* Net change preview */}
              <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                netChange > 0 ? 'bg-emerald-50 border-emerald-200' : netChange < 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-xs font-medium text-slate-500">{t('groups.detail.netLoss')}</span>
                <span className={`text-sm font-bold ${
                  netChange > 0 ? 'text-emerald-600' : netChange < 0 ? 'text-red-600' : 'text-slate-500'
                }`}>
                  {netChange > 0 ? '+' : ''}{netChange.toLocaleString()}
                </span>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  onClick={onClose}
                  variant="outlined"
                  fullWidth
                  disabled={isLoading}
                  sx={{
                    borderRadius: 3,
                    py: 1.25,
                    borderColor: '#e2e8f0',
                    color: '#64748b',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' },
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={isLoading}
                  sx={{
                    borderRadius: 3,
                    py: 1.25,
                    bgcolor: '#10b981',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                    '&:hover': { bgcolor: '#059669', boxShadow: '0 4px 14px rgba(16,185,129,0.45)' },
                  }}
                >
                  {isLoading ? t('common.saving') : t('common.save')}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  );
}
